import {
  CHAT_TOPIC_LIST_OPERATION,
  CHAT_TOPIC_SUBSCRIBE_OPERATION,
  TOPICS_OPERATIONS,
  type ExecuteEnvelopeOptions,
  type KnownOperation,
  type RchEnvelopeResponse,
} from "@reticulum/node-client";
import { defineStore } from "pinia";
import { computed, reactive, ref, shallowRef } from "vue";

import { useMessagingStore } from "./messagingStore";
import { useRchClientStore } from "./rchClientStore";
import { asArray, asRecord, readNumber, readString } from "./rchPayloadUtils";

type TopicsOperation = (typeof TOPICS_OPERATIONS)[number];
type TopicMutationOperation = "topic.create" | "topic.patch" | "topic.delete";
type SupportedTopicOperation = TopicsOperation | TopicMutationOperation;

const TOPIC_CREATE_OPERATION: TopicMutationOperation = "topic.create";
const TOPIC_PATCH_OPERATION: TopicMutationOperation = "topic.patch";
const TOPIC_DELETE_OPERATION: TopicMutationOperation = "topic.delete";

export interface TopicRecord {
  topicId: string;
  topicName?: string;
  topicPath?: string;
  topicDescription?: string;
  subscriberCount?: number;
  updatedAt?: string;
  raw: Record<string, unknown>;
}

export interface TopicSubscriptionRecord {
  topicId: string;
  destination?: string;
  status: "subscribed" | "failed";
  subscribedAt: number;
  error?: string;
}

export interface TopicMutationPayload {
  topic_id?: string;
  topic_name?: string;
  topic_path?: string;
  topic_description?: string;
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function wrapWireError(context: string, error: unknown): Error {
  return new Error(`${context}: ${toErrorMessage(error)}`);
}

function parsePayload(payloadJson: string): unknown {
  const trimmed = payloadJson.trim();
  if (!trimmed) {
    return {};
  }
  return JSON.parse(trimmed) as unknown;
}

function normalizeTopicRecord(raw: unknown): TopicRecord | null {
  const value = asRecord(raw);
  const topicId = readString(value, ["topic_id", "topicId", "id", "uid"]);
  if (!topicId) {
    return null;
  }

  return {
    topicId,
    topicName: readString(value, ["topic_name", "topicName", "name", "title"]),
    topicPath: readString(value, ["topic_path", "topicPath", "path"]),
    topicDescription: readString(value, [
      "topic_description",
      "topicDescription",
      "description",
      "summary",
    ]),
    subscriberCount: readNumber(value, [
      "subscriber_count",
      "subscriberCount",
      "subscribers",
      "listener_count",
    ]),
    updatedAt: readString(value, ["updated_at", "updatedAt", "created_at", "createdAt"]),
    raw: value,
  };
}

function defaultTopicName(topicId: string): string {
  return topicId
    .split(/[./:_-]+/g)
    .filter((segment) => segment.length > 0)
    .map((segment) => segment[0].toUpperCase() + segment.slice(1))
    .join(" ");
}

function sortTopics(left: TopicRecord, right: TopicRecord): number {
  const leftLabel = left.topicName ?? left.topicPath ?? left.topicId;
  const rightLabel = right.topicName ?? right.topicPath ?? right.topicId;
  return leftLabel.localeCompare(rightLabel);
}

export const useTopicsStore = defineStore("rch-topics", () => {
  const messagingStore = useMessagingStore();
  const rchClientStore = useRchClientStore();

  const operations = TOPICS_OPERATIONS;
  const mutationOperations = [
    TOPIC_CREATE_OPERATION,
    TOPIC_PATCH_OPERATION,
    TOPIC_DELETE_OPERATION,
  ] as const;
  const wired = ref(false);
  const busy = ref(false);
  const lastError = ref("");
  const lastOperation = shallowRef<SupportedTopicOperation | null>(null);
  const lastResponse = shallowRef<RchEnvelopeResponse<unknown> | null>(null);

  const topicsById = reactive<Record<string, TopicRecord>>({});
  const subscriptionsByTopicId = reactive<Record<string, TopicSubscriptionRecord>>({});

  let unsubscribeChatEvents: (() => void) | null = null;

  function rememberSubscription(
    topicId: string,
    patch: Partial<Omit<TopicSubscriptionRecord, "topicId" | "subscribedAt">> = {},
  ): void {
    const normalizedTopicId = topicId.trim();
    if (!normalizedTopicId) {
      return;
    }

    subscriptionsByTopicId[normalizedTopicId] = {
      topicId: normalizedTopicId,
      destination:
        patch.destination?.trim() || subscriptionsByTopicId[normalizedTopicId]?.destination,
      status: patch.status ?? subscriptionsByTopicId[normalizedTopicId]?.status ?? "subscribed",
      subscribedAt: Date.now(),
      error: patch.error,
    };
  }

  function upsertTopic(topic: TopicRecord): void {
    topicsById[topic.topicId] = {
      ...(topicsById[topic.topicId] ?? {}),
      ...topic,
      topicName: topic.topicName || topicsById[topic.topicId]?.topicName || defaultTopicName(topic.topicId),
      raw: topic.raw,
    };
  }

  function applyTopicList(payload: unknown): void {
    const value = asRecord(payload);
    const incoming = asArray(value.topics ?? value.items ?? value.entries)
      .map(normalizeTopicRecord)
      .filter((entry): entry is TopicRecord => Boolean(entry));

    const nextIds = new Set<string>();
    for (const topic of incoming) {
      nextIds.add(topic.topicId);
      upsertTopic(topic);
    }

    for (const existingId of Object.keys(topicsById)) {
      if (!nextIds.has(existingId)) {
        delete topicsById[existingId];
      }
    }
  }

  function applyTopicPayload(payload: unknown): void {
    const value = asRecord(payload);
    const topic = normalizeTopicRecord(value.topic ?? value);
    if (topic) {
      upsertTopic(topic);
      return;
    }

    const topics = asArray(value.topics).map(normalizeTopicRecord).filter(Boolean) as TopicRecord[];
    for (const entry of topics) {
      upsertTopic(entry);
    }
  }

  async function execute(
    operation: TopicsOperation,
    payload: unknown = {},
    options?: ExecuteEnvelopeOptions,
  ): Promise<RchEnvelopeResponse<unknown>> {
    busy.value = true;
    lastError.value = "";
    try {
      const client = await rchClientStore.requireClient();
      const response = await client.topics.execute(operation, payload, options);
      lastOperation.value = operation;
      lastResponse.value = response;
      if (operation === CHAT_TOPIC_LIST_OPERATION) {
        applyTopicList(response.payload);
      }
      return response;
    } catch (error: unknown) {
      lastError.value = toErrorMessage(error);
      throw error;
    } finally {
      busy.value = false;
    }
  }

  async function executeMutation(
    operation: TopicMutationOperation,
    payload: unknown,
    options?: ExecuteEnvelopeOptions,
  ): Promise<RchEnvelopeResponse<unknown>> {
    busy.value = true;
    lastError.value = "";
    try {
      const client = await rchClientStore.requireClient();
      const response = await client.execute<unknown, unknown>(operation as KnownOperation, payload, options);
      lastOperation.value = operation;
      lastResponse.value = response;
      applyTopicPayload(response.payload);
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
    if ((operations as readonly string[]).includes(operation)) {
      await execute(operation as TopicsOperation, parsePayload(payloadJson), options);
      return;
    }
    if ((mutationOperations as readonly string[]).includes(operation)) {
      await executeMutation(operation as TopicMutationOperation, parsePayload(payloadJson), options);
      return;
    }
    throw new Error(`Operation "${operation}" is not allowlisted for topics.`);
  }

  async function listTopics(): Promise<void> {
    await messagingStore.wire();
    const client = await rchClientStore.requireClient();
    const response = await client.chat.listTopics({});
    lastOperation.value = CHAT_TOPIC_LIST_OPERATION;
    lastResponse.value = response;
    applyTopicList(response.payload);
  }

  async function subscribeTopic(topicId: string, destination?: string): Promise<void> {
    await messagingStore.wire();
    const client = await rchClientStore.requireClient();
    const normalizedTopicId = topicId.trim();
    if (!normalizedTopicId) {
      return;
    }

    try {
      const response = await client.chat.subscribeTopic({
        topicId: normalizedTopicId,
        destination: destination?.trim() || undefined,
      });
      lastOperation.value = CHAT_TOPIC_SUBSCRIBE_OPERATION;
      lastResponse.value = response;
      rememberSubscription(normalizedTopicId, {
        destination,
        status: "subscribed",
        error: undefined,
      });
    } catch (error: unknown) {
      rememberSubscription(normalizedTopicId, {
        destination,
        status: "failed",
        error: toErrorMessage(error),
      });
      lastError.value = toErrorMessage(error);
      throw error;
    }
  }

  async function createTopic(payload: TopicMutationPayload): Promise<void> {
    await executeMutation(TOPIC_CREATE_OPERATION, payload);
    await listTopics();
  }

  async function patchTopic(
    topicId: string,
    patch: Omit<TopicMutationPayload, "topic_id">,
  ): Promise<void> {
    const normalizedTopicId = topicId.trim();
    if (!normalizedTopicId) {
      return;
    }
    await executeMutation(TOPIC_PATCH_OPERATION, {
      topic_id: normalizedTopicId,
      ...patch,
    });
    await listTopics();
  }

  async function deleteTopic(topicId: string): Promise<void> {
    const normalizedTopicId = topicId.trim();
    if (!normalizedTopicId) {
      return;
    }
    await executeMutation(TOPIC_DELETE_OPERATION, { topic_id: normalizedTopicId });
    delete topicsById[normalizedTopicId];
    delete subscriptionsByTopicId[normalizedTopicId];
  }

  async function wire(): Promise<void> {
    if (wired.value) {
      return;
    }

    try {
      await messagingStore.wire();
    } catch (error: unknown) {
      throw wrapWireError("messaging/chat", error);
    }
    const client = await rchClientStore.requireClient();
    unsubscribeChatEvents?.();
    unsubscribeChatEvents = client.chat.onEvent((event) => {
      if (event.type !== "topic.subscribed" || !event.topicId) {
        return;
      }
      rememberSubscription(event.topicId, {
        destination: event.destination,
        status: "subscribed",
        error: undefined,
      });
    });
    try {
      await listTopics();
    } catch (error: unknown) {
      throw wrapWireError(CHAT_TOPIC_LIST_OPERATION, error);
    }
    wired.value = true;
  }

  const topics = computed(() => Object.values(topicsById).sort(sortTopics));

  const subscriptions = computed(() =>
    Object.values(subscriptionsByTopicId).sort((a, b) => b.subscribedAt - a.subscribedAt),
  );

  const lastResponseJson = computed(() =>
    lastResponse.value ? JSON.stringify(lastResponse.value, null, 2) : "",
  );

  function clearSubscription(topicId: string): void {
    const normalizedTopicId = topicId.trim();
    if (!normalizedTopicId) {
      return;
    }
    delete subscriptionsByTopicId[normalizedTopicId];
  }

  return {
    operations,
    mutationOperations,
    wired,
    busy,
    lastError,
    lastOperation,
    lastResponse,
    lastResponseJson,
    topicsById,
    subscriptionsByTopicId,
    topics,
    subscriptions,
    execute,
    executeFromJson,
    wire,
    listTopics,
    subscribeTopic,
    createTopic,
    patchTopic,
    deleteTopic,
    rememberSubscription,
    clearSubscription,
    topicListOperation: CHAT_TOPIC_LIST_OPERATION,
    topicSubscribeOperation: CHAT_TOPIC_SUBSCRIBE_OPERATION,
  };
});
