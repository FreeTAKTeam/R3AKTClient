import {
  CHAT_TOPIC_LIST_OPERATION,
  CHAT_TOPIC_SUBSCRIBE_OPERATION,
  TOPICS_OPERATIONS,
  type ExecuteEnvelopeOptions,
  type RchEnvelopeResponse,
} from "@reticulum/node-client";
import { defineStore } from "pinia";
import { computed, reactive, ref, shallowRef } from "vue";

import { InvalidPayloadJsonError, tryParsePayload } from "./payloadParser";
import { useRchClientStore } from "./rchClientStore";

type TopicsOperation = (typeof TOPICS_OPERATIONS)[number];

interface TopicRecord {
  topicId: string;
  topicName?: string;
  topicPath?: string;
  topicDescription?: string;
}

interface TopicSubscriptionRecord {
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

export const useTopicsStore = defineStore("rch-topics", () => {
  const rchClientStore = useRchClientStore();

  const operations = TOPICS_OPERATIONS;
  const wired = ref(false);
  const busy = ref(false);
  const lastError = ref("");
  const lastOperation = shallowRef<TopicsOperation | null>(null);
  const lastResponse = shallowRef<RchEnvelopeResponse<unknown> | null>(null);

  const topicsById = reactive<Record<string, TopicRecord>>({});
  const subscriptionsByTopicId = reactive<Record<string, TopicSubscriptionRecord>>({});

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

    const parsedPayload = tryParsePayload(payloadJson);
    if (!parsedPayload.ok) {
      const message = `Invalid JSON payload for topics ${operation}: ${parsedPayload.error.message}`;
      lastError.value = message;
      throw new InvalidPayloadJsonError(message);
    }

    await execute(operation as TopicsOperation, parsedPayload.value, options);
  }

  async function listTopics(): Promise<void> {
    const client = await rchClientStore.requireClient();
    const response = await client.chat.listTopics({});
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
    const client = await rchClientStore.requireClient();
    const normalizedTopicId = topicId.trim();
    if (!normalizedTopicId) {
      return;
    }

    try {
      await client.chat.subscribeTopic({
        topicId: normalizedTopicId,
        destination: destination?.trim() || undefined,
      });
      subscriptionsByTopicId[normalizedTopicId] = {
        topicId: normalizedTopicId,
        destination: destination?.trim() || undefined,
        status: "subscribed",
        subscribedAt: Date.now(),
      };
    } catch (error: unknown) {
      subscriptionsByTopicId[normalizedTopicId] = {
        topicId: normalizedTopicId,
        destination: destination?.trim() || undefined,
        status: "failed",
        subscribedAt: Date.now(),
        error: toErrorMessage(error),
      };
      throw error;
    }
  }

  async function wire(): Promise<void> {
    if (wired.value) {
      return;
    }
    wired.value = true;
    await execute(CHAT_TOPIC_LIST_OPERATION, {}).catch(() => undefined);
    await listTopics().catch(() => undefined);
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
    topicListOperation: CHAT_TOPIC_LIST_OPERATION,
    topicSubscribeOperation: CHAT_TOPIC_SUBSCRIBE_OPERATION,
  };
});
