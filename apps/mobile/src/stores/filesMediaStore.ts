import {
  FILES_MEDIA_OPERATIONS,
  type AttachmentDirection,
  type AttachmentTransferState,
  type ChatAttachmentRef,
  type ExecuteEnvelopeOptions,
  type RchEnvelopeResponse,
} from "@reticulum/node-client";
import { defineStore } from "pinia";
import { computed, reactive, ref, shallowRef } from "vue";

import { createAppPersistenceNamespace } from "../persistence/appPersistence";
import { useRchClientStore } from "./rchClientStore";
import { asArray, asRecord, readNumber, readString } from "./rchPayloadUtils";

type FilesMediaOperation = (typeof FILES_MEDIA_OPERATIONS)[number];

const LIST_FILES_OPERATION: FilesMediaOperation = "ListFiles";
const LIST_IMAGES_OPERATION: FilesMediaOperation = "ListImages";
const RETRIEVE_FILE_OPERATION: FilesMediaOperation = "RetrieveFile";
const RETRIEVE_IMAGE_OPERATION: FilesMediaOperation = "RetrieveImage";
const TRANSFERS_STORAGE_KEY = "transfers.v1";
const REGISTRY_STORAGE_KEY = "registry.v1";
const filesMediaPersistence = createAppPersistenceNamespace("rch-files-media");

export interface FileTransferRecord {
  id: string;
  channelKey: string;
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
  url?: string;
  dataBase64?: string;
}

export interface MediaRegistryRecord {
  id: string;
  name: string;
  kind: "file" | "image";
  mimeType?: string;
  sizeBytes?: number;
  topicId?: string;
  updatedAt?: string;
  downloadedAtMs?: number;
  dataBase64?: string;
  previewUrl?: string;
  raw: Record<string, unknown>;
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

function fileToDataBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read attachment."));
    reader.onload = () => {
      const value = typeof reader.result === "string" ? reader.result : "";
      const marker = value.indexOf(",");
      resolve(marker >= 0 ? value.slice(marker + 1) : value);
    };
    reader.readAsDataURL(file);
  });
}

function normalizeMediaRecord(raw: unknown, kind: "file" | "image"): MediaRegistryRecord | null {
  const value = asRecord(raw);
  const id = readString(value, ["file_id", "fileId", "image_id", "imageId", "uid", "id"]);
  if (!id) {
    return null;
  }

  const mimeType =
    readString(value, ["mime_type", "mimeType", "content_type", "contentType"])
    || (kind === "image" ? "image/png" : undefined);
  const dataBase64 = readString(value, ["data_base64", "dataBase64", "base64"]);

  return {
    id,
    name: readString(value, ["name", "file_name", "filename", "title"]) ?? id,
    kind,
    mimeType,
    sizeBytes: readNumber(value, ["size_bytes", "sizeBytes", "size"]),
    topicId: readString(value, ["topic_id", "topicId", "TopicID"]),
    updatedAt: readString(value, ["updated_at", "updatedAt", "created_at", "createdAt"]),
    downloadedAtMs: dataBase64 ? Date.now() : undefined,
    dataBase64,
    previewUrl:
      dataBase64 && mimeType?.startsWith("image/")
        ? `data:${mimeType};base64,${dataBase64}`
        : undefined,
    raw: value,
  };
}

function sortRegistry(left: MediaRegistryRecord, right: MediaRegistryRecord): number {
  const leftTime = Date.parse(left.updatedAt ?? "") || 0;
  const rightTime = Date.parse(right.updatedAt ?? "") || 0;
  if (rightTime !== leftTime) {
    return rightTime - leftTime;
  }
  return left.name.localeCompare(right.name);
}

export const useFilesMediaStore = defineStore("rch-files-media", () => {
  const rchClientStore = useRchClientStore();

  const operations = FILES_MEDIA_OPERATIONS;
  const wired = ref(false);
  const busy = ref(false);
  const hydrated = ref(false);
  const lastError = ref("");
  const lastOperation = shallowRef<FilesMediaOperation | null>(null);
  const lastResponse = shallowRef<RchEnvelopeResponse<unknown> | null>(null);

  const transfersById = reactive<Record<string, FileTransferRecord>>({});
  const registryById = reactive<Record<string, MediaRegistryRecord>>({});

  let hydratePromise: Promise<void> | null = null;

  function persistState(): void {
    void Promise.all([
      filesMediaPersistence.setJson(TRANSFERS_STORAGE_KEY, Object.values(transfersById)),
      filesMediaPersistence.setJson(REGISTRY_STORAGE_KEY, Object.values(registryById)),
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
      const [storedTransfers, storedRegistry] = await Promise.all([
        filesMediaPersistence.getJson<FileTransferRecord[] | null>(TRANSFERS_STORAGE_KEY, null),
        filesMediaPersistence.getJson<MediaRegistryRecord[] | null>(REGISTRY_STORAGE_KEY, null),
      ]);

      for (const key of Object.keys(transfersById)) {
        delete transfersById[key];
      }
      for (const transfer of storedTransfers ?? []) {
        if (transfer.id?.trim()) {
          transfersById[transfer.id] = transfer;
        }
      }

      for (const key of Object.keys(registryById)) {
        delete registryById[key];
      }
      for (const record of storedRegistry ?? []) {
        if (record.id?.trim()) {
          registryById[record.id] = record;
        }
      }

      hydrated.value = true;
    })().finally(() => {
      hydratePromise = null;
    });

    await hydratePromise;
  }

  function upsertRegistryRecord(record: MediaRegistryRecord): void {
    registryById[record.id] = {
      ...(registryById[record.id] ?? {}),
      ...record,
      raw: record.raw,
    };
    persistState();
  }

  function replaceRegistry(kind: "file" | "image", records: readonly MediaRegistryRecord[]): void {
    const nextIds = new Set(records.map((record) => record.id));
    for (const record of records) {
      upsertRegistryRecord(record);
    }
    for (const existingId of Object.keys(registryById)) {
      if (registryById[existingId]?.kind === kind && !nextIds.has(existingId)) {
        delete registryById[existingId];
      }
    }
    persistState();
  }

  function applyResponseCache(operation: FilesMediaOperation, payload: unknown): void {
    const value = asRecord(payload);

    if (operation === LIST_FILES_OPERATION) {
      const records = asArray(value.files ?? value.attachments ?? value.items ?? value.entries)
        .map((entry) => normalizeMediaRecord(entry, "file"))
        .filter((entry): entry is MediaRegistryRecord => Boolean(entry));
      replaceRegistry("file", records);
      return;
    }

    if (operation === LIST_IMAGES_OPERATION) {
      const records = asArray(value.images ?? value.items ?? value.entries)
        .map((entry) => normalizeMediaRecord(entry, "image"))
        .filter((entry): entry is MediaRegistryRecord => Boolean(entry));
      replaceRegistry("image", records);
      return;
    }

    if (operation === RETRIEVE_FILE_OPERATION || operation === RETRIEVE_IMAGE_OPERATION) {
      const kind = operation === RETRIEVE_IMAGE_OPERATION ? "image" : "file";
      const record =
        normalizeMediaRecord(value.file ?? value.image ?? value.attachment ?? value, kind)
        || normalizeMediaRecord(
          (asArray(value.attachments)[0] ?? asArray(value.images)[0] ?? value) as unknown,
          kind,
        );
      if (record) {
        upsertRegistryRecord({
          ...record,
          downloadedAtMs: Date.now(),
        });
      }
    }
  }

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
      applyResponseCache(operation, response.payload);
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
    channelKey: string;
    messageLocalId?: string;
    name: string;
    mimeType?: string;
    sizeBytes?: number;
    direction?: AttachmentDirection;
  }): string {
    const id = createTransferId();
    transfersById[id] = {
      id,
      channelKey: input.channelKey,
      messageLocalId: input.messageLocalId,
      name: input.name.trim() || "attachment",
      mimeType: input.mimeType?.trim() || undefined,
      sizeBytes: input.sizeBytes,
      direction: input.direction ?? "upload",
      state: "queued",
      progressPct: 0,
      createdAtMs: Date.now(),
      updatedAtMs: Date.now(),
      url: undefined,
      dataBase64: undefined,
    };
    persistState();
    return id;
  }

  async function queueLocalFiles(
    files: readonly File[],
    input: {
      channelKey: string;
      direction?: AttachmentDirection;
    },
  ): Promise<string[]> {
    const created: string[] = [];
    for (const file of files) {
      const transferId = beginTransfer({
        channelKey: input.channelKey,
        name: file.name,
        mimeType: file.type || undefined,
        sizeBytes: file.size,
        direction: input.direction,
      });
      transfersById[transferId] = {
        ...transfersById[transferId],
        url: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
        dataBase64: await fileToDataBase64(file),
      };
      persistState();
      created.push(transferId);
    }
    return created;
  }

  function updateTransferState(
    transferId: string,
    next: {
      state: AttachmentTransferState;
      progressPct?: number;
      error?: string;
      messageLocalId?: string;
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
      messageLocalId: next.messageLocalId ?? current.messageLocalId,
      updatedAtMs: Date.now(),
    };
    persistState();
  }

  function getQueuedUploads(channelKey: string): {
    transferIds: string[];
    fileAttachments: ChatAttachmentRef[];
    image?: Record<string, unknown>;
  } {
    const queued = Object.values(transfersById).filter(
      (entry) => entry.channelKey === channelKey && entry.state === "queued",
    );

    const transferIds = queued.map((entry) => entry.id);
    const fileAttachments = queued.map((entry) => ({
      id: entry.id,
      name: entry.name,
      mimeType: entry.mimeType,
      sizeBytes: entry.sizeBytes,
      direction: entry.direction,
      transferState: entry.state,
      url: entry.url,
      error: entry.error,
      dataBase64: entry.dataBase64,
    }));

    const imageCandidate = queued.find((entry) => entry.mimeType?.startsWith("image/"));
    const image = imageCandidate
      ? {
        id: imageCandidate.id,
        name: imageCandidate.name,
        mime_type: imageCandidate.mimeType,
        size_bytes: imageCandidate.sizeBytes,
        data_base64: imageCandidate.dataBase64,
      }
      : undefined;

    return {
      transferIds,
      fileAttachments,
      image,
    };
  }

  function markTransfers(
    transferIds: readonly string[],
    next: {
      state: AttachmentTransferState;
      progressPct: number;
      messageLocalId?: string;
      error?: string;
    },
  ): void {
    for (const transferId of transferIds) {
      updateTransferState(transferId, next);
    }
  }

  async function listFiles(): Promise<void> {
    await execute(LIST_FILES_OPERATION, {});
  }

  async function listImages(): Promise<void> {
    await execute(LIST_IMAGES_OPERATION, {});
  }

  async function retrieveFile(fileId: string): Promise<void> {
    const normalizedFileId = fileId.trim();
    if (!normalizedFileId) {
      return;
    }
    await execute(RETRIEVE_FILE_OPERATION, { FileID: normalizedFileId, file_id: normalizedFileId });
  }

  async function retrieveImage(fileId: string): Promise<void> {
    const normalizedFileId = fileId.trim();
    if (!normalizedFileId) {
      return;
    }
    await execute(RETRIEVE_IMAGE_OPERATION, { FileID: normalizedFileId, file_id: normalizedFileId });
  }

  async function wire(): Promise<void> {
    if (wired.value) {
      return;
    }
    await hydrate();
    await rchClientStore.requireClient();
    await Promise.allSettled([listFiles(), listImages()]);
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

  const fileRegistry = computed(() =>
    Object.values(registryById)
      .filter((entry) => entry.kind === "file")
      .sort(sortRegistry),
  );

  const imageRegistry = computed(() =>
    Object.values(registryById)
      .filter((entry) => entry.kind === "image")
      .sort(sortRegistry),
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
    registryById,
    fileRegistry,
    imageRegistry,
    execute,
    executeFromJson,
    wire,
    beginTransfer,
    queueLocalFiles,
    updateTransferState,
    getQueuedUploads,
    markTransfers,
    listFiles,
    listImages,
    retrieveFile,
    retrieveImage,
  };
});
