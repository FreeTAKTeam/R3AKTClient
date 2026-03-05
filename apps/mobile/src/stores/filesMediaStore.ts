import {
  FILES_MEDIA_OPERATIONS,
  type AttachmentDirection,
  type AttachmentTransferState,
  type ExecuteEnvelopeOptions,
  type RchEnvelopeResponse,
} from "@reticulum/node-client";
import { defineStore } from "pinia";
import { computed, reactive, ref, shallowRef } from "vue";

import { useRchClientStore } from "./rchClientStore";

type FilesMediaOperation = (typeof FILES_MEDIA_OPERATIONS)[number];

interface FileTransferRecord {
  id: string;
  conversationId: string;
  messageLocalId?: string;
  name: string;
  mimeType?: string;
  sizeBytes?: number;
  direction: AttachmentDirection;
  state: AttachmentTransferState;
  progressPct: number;
  createdAtMs: number;
  updatedAtMs: number;
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

function createTransferId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `transfer-${Date.now().toString(36)}-${Math.floor(Math.random() * 1_000_000).toString(36)}`;
}

export const useFilesMediaStore = defineStore("rch-files-media", () => {
  const rchClientStore = useRchClientStore();

  const operations = FILES_MEDIA_OPERATIONS;
  const wired = ref(false);
  const busy = ref(false);
  const lastError = ref("");
  const lastOperation = shallowRef<FilesMediaOperation | null>(null);
  const lastResponse = shallowRef<RchEnvelopeResponse<unknown> | null>(null);

  const transfersById = reactive<Record<string, FileTransferRecord>>({});

  async function execute(
    operation: FilesMediaOperation,
    payload: unknown = {},
    options?: ExecuteEnvelopeOptions,
  ): Promise<RchEnvelopeResponse<unknown>> {
    busy.value = true;
    lastError.value = "";
    try {
      const client = await rchClientStore.requireClient();
      const response = await client.filesMedia.execute(operation, payload, options);
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
      throw new Error(`Operation "${operation}" is not allowlisted for filesMedia.`);
    }
    await execute(operation as FilesMediaOperation, parsePayload(payloadJson), options);
  }

  function beginTransfer(input: {
    conversationId: string;
    messageLocalId?: string;
    name: string;
    mimeType?: string;
    sizeBytes?: number;
    direction?: AttachmentDirection;
  }): string {
    const id = createTransferId();
    transfersById[id] = {
      id,
      conversationId: input.conversationId,
      messageLocalId: input.messageLocalId,
      name: input.name.trim() || "attachment",
      mimeType: input.mimeType?.trim() || undefined,
      sizeBytes: input.sizeBytes,
      direction: input.direction ?? "upload",
      state: "queued",
      progressPct: 0,
      createdAtMs: Date.now(),
      updatedAtMs: Date.now(),
    };
    return id;
  }

  function updateTransferState(
    transferId: string,
    next: {
      state: AttachmentTransferState;
      progressPct?: number;
      error?: string;
    },
  ): void {
    const current = transfersById[transferId];
    if (!current) {
      return;
    }
    transfersById[transferId] = {
      ...current,
      state: next.state,
      progressPct: next.progressPct ?? current.progressPct,
      error: next.error,
      updatedAtMs: Date.now(),
    };
  }

  async function wire(): Promise<void> {
    if (wired.value) {
      return;
    }
    await rchClientStore.requireClient();
    wired.value = true;
  }

  const transfers = computed(() =>
    Object.values(transfersById).sort((a, b) => b.updatedAtMs - a.updatedAtMs),
  );

  const activeTransfers = computed(() =>
    transfers.value.filter(
      (entry) => entry.state === "queued" || entry.state === "in_progress",
    ),
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
    transfersById,
    transfers,
    activeTransfers,
    execute,
    executeFromJson,
    wire,
    beginTransfer,
    updateTransferState,
  };
});
