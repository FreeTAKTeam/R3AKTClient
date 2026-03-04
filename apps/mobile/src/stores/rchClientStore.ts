import {
  createRchClient,
  type RchClient,
  type RchClientEvents,
  type ReticulumNodeClient,
} from "@reticulum/node-client";
import { defineStore } from "pinia";
import { shallowRef } from "vue";

import { useNodeStore } from "./nodeStore";

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export const useRchClientStore = defineStore("rch-client", () => {
  const nodeStore = useNodeStore();
  const sourceNodeClient = shallowRef<ReticulumNodeClient | null>(null);
  const rchClient = shallowRef<RchClient | null>(null);

  function syncClient(): RchClient | null {
    const nodeClient = nodeStore.getNodeClient();

    if (!nodeClient) {
      rchClient.value?.dispose();
      rchClient.value = null;
      sourceNodeClient.value = null;
      return null;
    }

    if (!rchClient.value || sourceNodeClient.value !== nodeClient) {
      rchClient.value?.dispose();
      rchClient.value = createRchClient(nodeClient);
      sourceNodeClient.value = nodeClient;
    }

    return rchClient.value;
  }

  async function requireClient(): Promise<RchClient> {
    await nodeStore.init();
    const client = syncClient();
    if (!client) {
      throw new Error("Reticulum node client is not initialized.");
    }
    return client;
  }

  function getClient(): RchClient | null {
    return syncClient();
  }

  function on<K extends keyof RchClientEvents>(
    event: K,
    handler: (payload: RchClientEvents[K]) => void,
  ): () => void {
    const client = syncClient();
    if (!client) {
      return () => undefined;
    }
    return client.on(event, handler);
  }

  function clearClient(): void {
    rchClient.value?.dispose();
    rchClient.value = null;
    sourceNodeClient.value = null;
  }

  function captureClientError(error: unknown): Error {
    return error instanceof Error ? error : new Error(toErrorMessage(error));
  }

  return {
    getClient,
    requireClient,
    on,
    clearClient,
    captureClientError,
  };
});
