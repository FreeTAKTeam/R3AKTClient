import type {
  ExecuteEnvelopeOptions,
  RchEnvelopeResponse,
  RchFeatureKey,
  RchFeatureOperationMap,
} from "@reticulum/node-client";
import { defineStore } from "pinia";
import { computed, ref, shallowRef } from "vue";

import { useRchClientStore } from "./rchClientStore";

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

export function createRchFeatureStore<K extends RchFeatureKey>(
  storeId: string,
  feature: K,
  operations: readonly RchFeatureOperationMap[K][],
) {
  return defineStore(storeId, () => {
    const rchClientStore = useRchClientStore();

    const wired = ref(false);
    const busy = ref(false);
    const lastError = ref("");
    const lastOperation = shallowRef<RchFeatureOperationMap[K] | null>(null);
    const lastResponse = shallowRef<RchEnvelopeResponse<unknown> | null>(null);

    async function execute(
      operation: RchFeatureOperationMap[K],
      payload: unknown = {},
      options?: ExecuteEnvelopeOptions,
    ): Promise<RchEnvelopeResponse<unknown>> {
      busy.value = true;
      lastError.value = "";
      try {
        const client = await rchClientStore.requireClient();
        const response = await client[feature].execute(operation, payload, options);
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
        throw new Error(
          `Operation \"${operation}\" is not allowlisted for ${feature}.`,
        );
      }

      await execute(
        operation as RchFeatureOperationMap[K],
        parsePayload(payloadJson),
        options,
      );
    }

    async function wire(): Promise<void> {
      if (wired.value || operations.length === 0) {
        return;
      }
      wired.value = true;
      await execute(operations[0]);
    }

    const lastResponseJson = computed(() =>
      lastResponse.value ? JSON.stringify(lastResponse.value, null, 2) : "",
    );

    return {
      feature,
      operations,
      wired,
      busy,
      lastError,
      lastOperation,
      lastResponse,
      lastResponseJson,
      execute,
      executeFromJson,
      wire,
    };
  });
}
