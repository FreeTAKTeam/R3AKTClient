import {
  CHAT_TOPIC_LIST_OPERATION,
  CHAT_TOPIC_SUBSCRIBE_OPERATION,
  CHAT_MESSAGE_SEND_OPERATION,
  MESSAGES_OPERATIONS,
  type ChatEvent,
  type ChatMessage,
  type ExecuteEnvelopeOptions,
  type RchEnvelopeResponse,
} from "@reticulum/node-client";
import { defineStore } from "pinia";
import { computed, reactive, ref, shallowRef } from "vue";

import { createAppPersistenceNamespace } from "../persistence/appPersistence";
import { useNodeStore } from "./nodeStore";
import { useFilesMediaStore } from "./filesMediaStore";
import { InvalidPayloadJsonError, tryParsePayload } from "./payloadParser";
import { useProjectionStore } from "./projectionStore";
import { useRchClientStore } from "./rchClientStore";

const CHAT_DRAFT_STORAGE_KEY = "reticulum.mobile.chat.drafts.v3";
const CHAT_MESSAGES_STORAGE_KEY = "reticulum.mobile.chat.messages.v1";
const CHAT_CHANNELS_STORAGE_KEY = "reticulum.mobile.chat.channels.v1";
const messagingPersistence = createAppPersistenceNamespace("rch-messaging");
const GLOBAL_CHANNEL_KEY = "hub:global";
const REQUIRED_CHAT_OPERATIONS = [
  CHAT_TOPIC_LIST_OPERATION,
  CHAT_TOPIC_SUBSCRIBE_OPERATION,
] as const;

type MessagingOperation = (typeof MESSAGES_OPERATIONS)[number];
export type MessageDeliveryState = "queued" | "sent" | "failed";

export interface MessagingChannelRecord {
  channelKey: string;
  title: string;
  destination?: string;
  topicId?: string;
  updatedAtMs: number;
  messageIds: string[];
}

export interface MessagingCapabilityState {
  messageSend: boolean;
  topicList: boolean;
  topicSubscribe: boolean;
}

export interface MessagingMessageRecord extends ChatMessage {
  channelKey: string;
  deliveryState: MessageDeliveryState;
  error?: string;
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function createMessageId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `chat-${Date.now().toString(36)}-${Math.floor(Math.random() * 1_000_000).toString(36)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeDestination(destination?: string): string | undefined {
  const normalized = destination?.trim().toLowerCase();
  return normalized || undefined;
}

function normalizeTopicId(topicId?: string): string | undefined {
  const normalized = topicId?.trim();
  return normalized || undefined;
}

function channelTitle(topicId?: string, destination?: string): string {
  if (topicId) {
    return `Topic ${topicId}`;
  }
  if (destination) {
    return `DM ${destination.slice(0, 8)}`;
  }
  return "Global Hub";
}

export function buildChannelKey(input: {
  topicId?: string;
  destination?: string;
} = {}): string {
  const topicId = normalizeTopicId(input.topicId);
  if (topicId) {
    return `topic:${topicId}`;
  }

  const destination = normalizeDestination(input.destination);
  if (destination) {
    return `dm:${destination}`;
  }

  return GLOBAL_CHANNEL_KEY;
}

export function describeChannelKey(channelKey: string): {
  destination?: string;
  topicId?: string;
} {
  if (channelKey.startsWith("topic:")) {
    return {
      topicId: normalizeTopicId(channelKey.slice("topic:".length)),
    };
  }

  if (channelKey.startsWith("dm:")) {
    return {
      destination: normalizeDestination(channelKey.slice("dm:".length)),
    };
  }

  return {};
}

function normalizeStoredDrafts(parsed: Record<string, unknown> | null): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(parsed ?? {})) {
    if (typeof value === "string" && value.trim().length > 0) {
      out[key] = value;
    }
  }
  return out;
}

async function loadStoredDrafts(): Promise<Record<string, string>> {
  const parsed = await messagingPersistence.getJson<Record<string, unknown> | null>(
    CHAT_DRAFT_STORAGE_KEY,
    null,
  );
  return normalizeStoredDrafts(parsed);
}

export const useMessagingStore = defineStore("rch-messaging", () => {
  const nodeStore = useNodeStore();
  const filesMediaStore = useFilesMediaStore();
  const projectionStore = useProjectionStore();
  const rchClientStore = useRchClientStore();

  const operations = MESSAGES_OPERATIONS;
  const wired = ref(false);
  const busy = ref(false);
  const lastError = ref("");
  const hydrated = ref(false);
  const lastOperation = shallowRef<MessagingOperation | null>(null);
  const lastResponse = shallowRef<RchEnvelopeResponse<unknown> | null>(null);
  const activeChannelKey = ref(GLOBAL_CHANNEL_KEY);

  const capabilities = reactive<MessagingCapabilityState>({
    messageSend: false,
    topicList: false,
    topicSubscribe: false,
  });
  const messagesByLocalId = reactive<Record<string, MessagingMessageRecord>>({});
  const channelsByKey = reactive<Record<string, MessagingChannelRecord>>({
    [GLOBAL_CHANNEL_KEY]: {
      channelKey: GLOBAL_CHANNEL_KEY,
      title: channelTitle(),
      updatedAtMs: Date.now(),
      messageIds: [],
    },
  });
  const draftsByChannel = reactive<Record<string, string>>({});

  let hydratePromise: Promise<void> | null = null;
  let unsubscribeChatEvents: (() => void) | null = null;

  function persistDrafts(): void {
    void messagingPersistence.setJson(CHAT_DRAFT_STORAGE_KEY, draftsByChannel);
  }

  function persistChannelsAndMessages(): void {
    void Promise.all([
      messagingPersistence.setJson(
        CHAT_CHANNELS_STORAGE_KEY,
        Object.values(channelsByKey),
      ),
      messagingPersistence.setJson(
        CHAT_MESSAGES_STORAGE_KEY,
        Object.values(messagesByLocalId),
      ),
    ]);
  }

  async function hydrate(): Promise<void> {
    if (hydrated.value) {
      return;
    }
    if (hydratePromise) {
      await hydratePromise;
      return;
    }

    hydratePromise = (async () => {
      const [storedDrafts, storedChannels, storedMessages] = await Promise.all([
        loadStoredDrafts(),
        messagingPersistence.getJson<MessagingChannelRecord[] | null>(
          CHAT_CHANNELS_STORAGE_KEY,
          null,
        ),
        messagingPersistence.getJson<MessagingMessageRecord[] | null>(
          CHAT_MESSAGES_STORAGE_KEY,
          null,
        ),
      ]);

      for (const key of Object.keys(draftsByChannel)) {
        delete draftsByChannel[key];
      }
      Object.assign(draftsByChannel, storedDrafts);

      for (const key of Object.keys(channelsByKey)) {
        delete channelsByKey[key];
      }
      channelsByKey[GLOBAL_CHANNEL_KEY] = {
        channelKey: GLOBAL_CHANNEL_KEY,
        title: channelTitle(),
        updatedAtMs: Date.now(),
        messageIds: [],
      };
      for (const record of storedChannels ?? []) {
        if (!record.channelKey?.trim()) {
          continue;
        }
        channelsByKey[record.channelKey] = {
          ...record,
          messageIds: Array.isArray(record.messageIds) ? [...record.messageIds] : [],
        };
      }

      for (const key of Object.keys(messagesByLocalId)) {
        delete messagesByLocalId[key];
      }
      for (const record of storedMessages ?? []) {
        if (!record.localMessageId?.trim()) {
          continue;
        }
        messagesByLocalId[record.localMessageId] = {
          ...record,
        };
        ensureChannel(record.channelKey, {
          destination: record.destination,
          topicId: record.topicId,
          updatedAtMs: Date.parse(record.issuedAt) || Date.now(),
        });
        const channel = channelsByKey[record.channelKey];
        if (!channel.messageIds.includes(record.localMessageId)) {
          channel.messageIds.push(record.localMessageId);
        }
      }

      hydrated.value = true;
    })().finally(() => {
      hydratePromise = null;
    });

    await hydratePromise;
  }

  function ensureChannel(
    channelKey: string,
    patch: Partial<Omit<MessagingChannelRecord, "channelKey" | "messageIds">> = {},
  ): MessagingChannelRecord {
    const descriptor = describeChannelKey(channelKey);
    if (!channelsByKey[channelKey]) {
      channelsByKey[channelKey] = {
        channelKey,
        title: patch.title ?? channelTitle(descriptor.topicId, descriptor.destination),
        destination: patch.destination ?? descriptor.destination,
        topicId: patch.topicId ?? descriptor.topicId,
        updatedAtMs: patch.updatedAtMs ?? Date.now(),
        messageIds: [],
      };
    }

    const channel = channelsByKey[channelKey];
    channel.destination = normalizeDestination(patch.destination ?? channel.destination);
    channel.topicId = normalizeTopicId(patch.topicId ?? channel.topicId);
    channel.title = patch.title ?? channelTitle(channel.topicId, channel.destination);
    channel.updatedAtMs = patch.updatedAtMs ?? channel.updatedAtMs;
    persistChannelsAndMessages();
    return channel;
  }

  function detachMessageFromChannel(channelKey: string, localMessageId: string): void {
    const channel = channelsByKey[channelKey];
    if (!channel) {
      return;
    }
    channel.messageIds = channel.messageIds.filter((entry) => entry !== localMessageId);
    persistChannelsAndMessages();
  }

  function upsertMessage(
    message: ChatMessage,
    patch: {
      channelKey?: string;
      deliveryState?: MessageDeliveryState;
      error?: string;
    } = {},
  ): MessagingMessageRecord {
    const existing = messagesByLocalId[message.localMessageId];
    const topicId = normalizeTopicId(message.topicId ?? existing?.topicId);
    const destination = normalizeDestination(message.destination ?? existing?.destination);
    const channelKey =
      patch.channelKey
      ?? existing?.channelKey
      ?? buildChannelKey({ topicId, destination });
    const deliveryState =
      patch.deliveryState
      ?? existing?.deliveryState
      ?? (message.direction === "outbound" ? "sent" : "sent");
    const record: MessagingMessageRecord = {
      ...existing,
      ...message,
      topicId,
      destination,
      channelKey,
      deliveryState,
      error: patch.error ?? (deliveryState === "failed" ? existing?.error : undefined),
    };

    if (existing?.channelKey && existing.channelKey !== channelKey) {
      detachMessageFromChannel(existing.channelKey, message.localMessageId);
    }

    messagesByLocalId[message.localMessageId] = record;

    const issuedAtMs = Date.parse(record.issuedAt);
    const channel = ensureChannel(channelKey, {
      destination,
      topicId,
      updatedAtMs: Number.isFinite(issuedAtMs) ? issuedAtMs : Date.now(),
    });
    if (!channel.messageIds.includes(record.localMessageId)) {
      channel.messageIds.push(record.localMessageId);
    }
    channel.updatedAtMs = Math.max(
      channel.updatedAtMs,
      Number.isFinite(issuedAtMs) ? issuedAtMs : Date.now(),
    );
    persistChannelsAndMessages();

    return record;
  }

  function applyMessageState(
    localMessageId: string,
    state: MessageDeliveryState,
    error?: string,
  ): void {
    const existing = messagesByLocalId[localMessageId];
    if (!existing) {
      return;
    }

    upsertMessage(existing, {
      channelKey: existing.channelKey,
      deliveryState: state,
      error,
    });
  }

  function handleChatEvent(event: ChatEvent): void {
    if (event.type === "message.receive") {
      upsertMessage(event.message, { deliveryState: "sent" });
      filesMediaStore.markTransfers(
        Object.values(filesMediaStore.transfersById)
          .filter((entry) => entry.messageLocalId === event.message.localMessageId)
          .map((entry) => entry.id),
        {
          state: "completed",
          progressPct: 100,
          messageLocalId: event.message.localMessageId,
        },
      );
      return;
    }

    if (event.type === "message.sent") {
      upsertMessage(event.message, { deliveryState: "sent" });
      return;
    }

    if (event.type === "topic.subscribed") {
      ensureChannel(
        buildChannelKey({
          topicId: event.topicId,
          destination: event.destination,
        }),
        {
          topicId: event.topicId,
          destination: event.destination,
          updatedAtMs: event.meta.receivedAtMs,
        },
      );
    }
  }

  async function refreshCapabilities(): Promise<void> {
    await nodeStore.init();
    const nodeClient = nodeStore.getNodeClient();
    if (!nodeClient) {
      throw new Error("Reticulum node client is not initialized.");
    }

    const catalog = await nodeClient.getClientOperationCatalog();
    const available = new Set(catalog.map((entry) => entry.operation));
    capabilities.messageSend = true;
    capabilities.topicList = available.has(CHAT_TOPIC_LIST_OPERATION);
    capabilities.topicSubscribe = available.has(CHAT_TOPIC_SUBSCRIBE_OPERATION);
  }

  async function execute(
    operation: MessagingOperation,
    payload: unknown = {},
    options?: ExecuteEnvelopeOptions,
  ): Promise<RchEnvelopeResponse<unknown>> {
    busy.value = true;
    lastError.value = "";
    try {
      const client = await rchClientStore.requireClient();
      const response = await client.messages.execute(operation, payload, options);
      lastOperation.value = operation;
      lastResponse.value = response;
      return response;
    } catch (error: unknown) {
      lastError.value = toErrorMessage(error);
      throw error;
    } finally {
      busy.value = false;
    }
  }

  async function executeFromJson(
    operation: string,
    payloadJson = "{}",
    options?: ExecuteEnvelopeOptions,
  ): Promise<void> {
    if (!(operations as readonly string[]).includes(operation)) {
      throw new Error(`Operation "${operation}" is not allowlisted for messages.`);
    }

    const parsedPayload = tryParsePayload(payloadJson);
    if (!parsedPayload.ok) {
      const message = `Invalid JSON payload for messages ${operation}: ${parsedPayload.error.message}`;
      lastError.value = message;
      throw new InvalidPayloadJsonError(message);
    }

    await execute(operation as MessagingOperation, parsedPayload.value, options);
  }

  async function wire(): Promise<void> {
    if (wired.value) {
      return;
    }

    await hydrate();
    await projectionStore.init();
    lastError.value = "";
    await refreshCapabilities();
    const readyNow =
      capabilities.messageSend && capabilities.topicList && capabilities.topicSubscribe;
    if (!readyNow) {
      const missing = REQUIRED_CHAT_OPERATIONS.filter(
        (operation) =>
          ![
            capabilities.topicList && CHAT_TOPIC_LIST_OPERATION,
            capabilities.topicSubscribe && CHAT_TOPIC_SUBSCRIBE_OPERATION,
          ].includes(operation),
      );
      const message = `Messaging requires hub operations: ${missing.join(", ")}.`;
      lastError.value = message;
      throw new Error(message);
    }

    const client = await rchClientStore.requireClient();
    unsubscribeChatEvents?.();
    unsubscribeChatEvents = client.chat.onEvent(handleChatEvent);
    wired.value = true;
  }

  function setActiveChannel(channelKey: string): void {
    ensureChannel(channelKey);
    activeChannelKey.value = channelKey;
  }

  function setDraft(value: string, channelKey = activeChannelKey.value): void {
    draftsByChannel[channelKey] = value;
    persistDrafts();
  }

  async function sendDraft(options: {
    channelKey?: string;
    destination?: string;
    topicId?: string;
  } = {}): Promise<void> {
    await wire();
    await filesMediaStore.wire();
    const descriptor = {
      ...describeChannelKey(options.channelKey ?? activeChannelKey.value),
      destination: normalizeDestination(options.destination) ?? describeChannelKey(options.channelKey ?? activeChannelKey.value).destination,
      topicId: normalizeTopicId(options.topicId) ?? describeChannelKey(options.channelKey ?? activeChannelKey.value).topicId,
    };
    const channelKey = options.channelKey ?? buildChannelKey(descriptor);
    const draft = (draftsByChannel[channelKey] ?? "").trim();
    if (!draft) {
      return;
    }

    const localMessageId = createMessageId();
    const issuedAt = nowIso();
    const pendingUploads = filesMediaStore.getQueuedUploads(channelKey);
    const optimisticMessage: ChatMessage = {
      localMessageId,
      direction: "outbound",
      content: draft,
      destination: descriptor.destination,
      topicId: descriptor.topicId,
      issuedAt,
      attachments: pendingUploads.fileAttachments,
      image: pendingUploads.image,
    };

    ensureChannel(channelKey, {
      destination: descriptor.destination,
      topicId: descriptor.topicId,
    });
    setActiveChannel(channelKey);
    upsertMessage(optimisticMessage, {
      channelKey,
      deliveryState: "queued",
    });
    await projectionStore.recordCommandRequest(
      CHAT_MESSAGE_SEND_OPERATION,
      optimisticMessage,
      {
        conversationId: localMessageId,
        feature: "messages",
        aggregateRef: {
          feature: "messages",
          entityType: "channel",
          entityId: channelKey,
          channelKey,
        },
        requestSummary: draft,
      },
    );
    filesMediaStore.markTransfers(pendingUploads.transferIds, {
      state: "in_progress",
      progressPct: 35,
      messageLocalId: localMessageId,
    });
    draftsByChannel[channelKey] = "";
    persistDrafts();

    try {
      const client = await rchClientStore.requireClient();
      const response = await client.chat.sendMessage({
        localMessageId,
        content: draft,
        destination: descriptor.destination,
        topicId: descriptor.topicId,
        fileAttachments: pendingUploads.fileAttachments,
        image: pendingUploads.image,
      });
      await projectionStore.recordCommandResponse(
        CHAT_MESSAGE_SEND_OPERATION,
        response,
        {
          conversationId: localMessageId,
          feature: "messages",
          aggregateRef: {
            feature: "messages",
            entityType: "channel",
            entityId: channelKey,
            channelKey,
          },
          requestSummary: draft,
        },
      );
      upsertMessage(
        {
          localMessageId: response.payload.localMessageId,
          direction: "outbound",
          content: response.payload.content || draft,
          destination: response.payload.destination ?? descriptor.destination,
          topicId: response.payload.topicId ?? descriptor.topicId,
          issuedAt,
          attachments: pendingUploads.fileAttachments,
          image: pendingUploads.image,
        },
        {
          channelKey,
          deliveryState:
            response.payload.sent && messagesByLocalId[response.payload.localMessageId]?.deliveryState === "sent"
              ? "sent"
              : response.payload.sent
                ? "queued"
                : "failed",
        },
      );
      filesMediaStore.markTransfers(pendingUploads.transferIds, {
        state: response.payload.sent ? "in_progress" : "failed",
        progressPct: response.payload.sent ? 75 : 35,
        messageLocalId: response.payload.localMessageId,
        error: response.payload.sent ? undefined : "Attachment send was rejected.",
      });
    } catch (error: unknown) {
      applyMessageState(localMessageId, "failed", toErrorMessage(error));
      await projectionStore.recordCommandFailure(localMessageId, toErrorMessage(error));
      filesMediaStore.markTransfers(pendingUploads.transferIds, {
        state: "failed",
        progressPct: 35,
        messageLocalId: localMessageId,
        error: toErrorMessage(error),
      });
      lastError.value = toErrorMessage(error);
      throw error;
    }
  }

  const ready = computed(
    () =>
      wired.value
      && capabilities.messageSend
      && capabilities.topicList
      && capabilities.topicSubscribe,
  );

  const channels = computed(() =>
    Object.values(channelsByKey).sort((left, right) => right.updatedAtMs - left.updatedAtMs),
  );

  const activeMessages = computed(() => {
    const channel = channelsByKey[activeChannelKey.value];
    if (!channel) {
      return [] as MessagingMessageRecord[];
    }

    return [...channel.messageIds]
      .map((messageId) => messagesByLocalId[messageId])
      .filter((message): message is MessagingMessageRecord => Boolean(message))
      .sort((left, right) => Date.parse(left.issuedAt) - Date.parse(right.issuedAt));
  });

  const activeDraft = computed(() => draftsByChannel[activeChannelKey.value] ?? "");

  const failedCount = computed(
    () => activeMessages.value.filter((message) => message.deliveryState === "failed").length,
  );

  const queuedCount = computed(
    () => activeMessages.value.filter((message) => message.deliveryState === "queued").length,
  );

  const lastResponseJson = computed(() =>
    lastResponse.value ? JSON.stringify(lastResponse.value, null, 2) : "",
  );

  return {
    operations,
    wired,
    busy,
    ready,
    lastError,
    lastOperation,
    lastResponse,
    lastResponseJson,
    capabilities,
    activeChannelKey,
    messagesByLocalId,
    channelsByKey,
    channels,
    activeMessages,
    activeDraft,
    failedCount,
    queuedCount,
    execute,
    executeFromJson,
    wire,
    setActiveChannel,
    setDraft,
    sendDraft,
  };
});
