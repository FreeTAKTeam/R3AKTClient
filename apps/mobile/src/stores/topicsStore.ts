import {
  CHAT_TOPIC_LIST_OPERATION,
  CHAT_TOPIC_SUBSCRIBE_OPERATION,
  TOPICS_OPERATIONS,
  type ExecuteEnvelopeOptions,
  type RchEnvelopeResponse,
} from "@reticulum/node-client";
import { defineStore } from "pinia";
import { computed, reactive, ref, shallowRef } from "vue";

import { useMessagingStore } from "./messagingStore";
import { useRchClientStore } from "./rchClientStore";

type TopicsOperation = (typeof TOPICS_OPERATIONS)[number];

export interface TopicRecord {
  topicId: string;
  topicName?: string;
  topicPath?: string;
  topicDescription?: string;
}

export interface TopicSubscriptionRecord {
  topicId: string;
  destination?: string;
  status: "subscribed" | "failed";
  subscribedAt: number;
  error?: string;
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function parsePayload(payloadJson: string): unknown {
  const trimmed = payloadJson.trim();
  if (!trimmed) {
    return {};
  }
  return JSON.parse(trimmed) as unknown;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function normalizeTopicRecord(raw: unknown): TopicRecord | null {
  const value = asRecord(raw);
  const topicId = String(value.topic_id ?? value.topicId ?? "").trim();
  if (!topicId) {
    return null;
  }
  return {
    topicId,
    topicName: String(value.topic_name ?? value.topicName ?? "").trim() || undefined,
    topicPath: String(value.topic_path ?? value.topicPath ?? "").trim() || undefined,
    topicDescription: String(
      value.topic_description ?? value.topicDescription ?? "",
    ).trim() || undefined,
  };
}

function defaultTopicName(topicId: string): string {
  return topicId
    .split(/[./:_-]+/g)
    .filter((segment) => segment.length > 0)
    .map((segment) => segment[0].toUpperCase() + segment.slice(1))
    .join(" ");
}

export const useTopicsStore = defineStore("rch-topics", () => {
  const messagingStore = useMessagingStore();
  const rchClientStore = useRchClientStore();

  const operations = TOPICS_OPERATIONS;
  const wired = ref(false);
  const busy = ref(false);
  const lastError = ref("");
  const lastOperation = shallowRef<TopicsOperation | null>(null);
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
      destination: patch.destination?.trim() || subscriptionsByTopicId[normalizedTopicId]?.destination,
      status: patch.status ?? subscriptionsByTopicId[normalizedTopicId]?.status ?? "subscribed",
      subscribedAt: Date.now(),
      error: patch.error,
    };
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
      throw new Error(`Operation "${operation}" is not allowlisted for topics.`);
    }
    await execute(operation as TopicsOperation, parsePayload(payloadJson), options);
  }

  async function listTopics(): Promise<void> {
    await messagingStore.wire();
    const client = await rchClientStore.requireClient();
    const response = await client.chat.listTopics({});
    lastOperation.value = CHAT_TOPIC_LIST_OPERATION;
    lastResponse.value = response;

    const payload = asRecord(response.payload);
    const incoming = Array.isArray(payload.topics) ? payload.topics : [];
    for (const entry of incoming) {
      const normalized = normalizeTopicRecord(entry);
      if (!normalized) {
        continue;
      }
      topicsById[normalized.topicId] = normalized;
    }
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

  async function wire(): Promise<void> {
    if (wired.value) {
      return;
    }

    await messagingStore.wire();
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
    await listTopics();
    wired.value = true;
  }

  const topics = computed(() =>
    Object.values(topicsById).sort((a, b) => a.topicId.localeCompare(b.topicId)),
  );

  const subscriptions = computed(() =>
    Object.values(subscriptionsByTopicId).sort((a, b) => b.subscribedAt - a.subscribedAt),
  );

  const lastResponseJson = computed(() =>
    lastResponse.value ? JSON.stringify(lastResponse.value, null, 2) : "",
  );

  function rememberTopic(
    topicId: string,
    patch: Partial<Omit<TopicRecord, "topicId">> = {},
  ): void {
    const normalizedTopicId = topicId.trim();
    if (!normalizedTopicId) {
      return;
    }

    topicsById[normalizedTopicId] = {
      topicId: normalizedTopicId,
      topicName:
        patch.topicName?.trim()
        || topicsById[normalizedTopicId]?.topicName
        || defaultTopicName(normalizedTopicId),
      topicPath: patch.topicPath?.trim() || topicsById[normalizedTopicId]?.topicPath,
      topicDescription:
        patch.topicDescription?.trim() || topicsById[normalizedTopicId]?.topicDescription,
    };
  }

  function clearSubscription(topicId: string): void {
    const normalizedTopicId = topicId.trim();
    if (!normalizedTopicId) {
      return;
    }
    delete subscriptionsByTopicId[normalizedTopicId];
  }

  return {
    operations,
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
    rememberTopic,
    rememberSubscription,
    clearSubscription,
    topicListOperation: CHAT_TOPIC_LIST_OPERATION,
    topicSubscribeOperation: CHAT_TOPIC_SUBSCRIBE_OPERATION,
  };
});
