import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

interface MediaBinaryRecord {
  name: string;
  kind: "file" | "image";
  mimeType?: string;
  dataBase64?: string;
  previewUrl?: string;
}

const FALLBACK_IMAGE_MIME = "image/png";
const FALLBACK_FILE_MIME = "application/octet-stream";

function ensureBase64(record: MediaBinaryRecord): string {
  const normalized = record.dataBase64?.trim();
  if (!normalized) {
    throw new Error("Retrieve the record before previewing, downloading, or sharing it.");
  }
  return normalized;
}

function normalizedMimeType(record: MediaBinaryRecord): string {
  if (record.mimeType?.trim()) {
    return record.mimeType.trim();
  }
  return record.kind === "image" ? FALLBACK_IMAGE_MIME : FALLBACK_FILE_MIME;
}

function extensionFromMimeType(mimeType: string): string {
  const normalized = mimeType.toLowerCase();
  if (normalized === "image/png") {
    return "png";
  }
  if (normalized === "image/jpeg") {
    return "jpg";
  }
  if (normalized === "image/webp") {
    return "webp";
  }
  if (normalized === "application/pdf") {
    return "pdf";
  }
  if (normalized === "text/plain") {
    return "txt";
  }
  if (normalized === "application/json") {
    return "json";
  }
  return "bin";
}

function sanitizeBaseName(name: string): string {
  const normalized = name.trim().replace(/[^a-z0-9._-]+/gi, "-").replace(/-+/g, "-");
  return normalized.replace(/^-|-$/g, "") || "attachment";
}

function suggestedFileName(record: MediaBinaryRecord): string {
  const baseName = sanitizeBaseName(record.name);
  if (/\.[a-z0-9]{2,5}$/i.test(baseName)) {
    return baseName;
  }
  return `${baseName}.${extensionFromMimeType(normalizedMimeType(record))}`;
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const decoded = atob(base64);
  const bytes = new Uint8Array(decoded.length);
  for (let index = 0; index < decoded.length; index += 1) {
    bytes[index] = decoded.charCodeAt(index);
  }
  return new Blob([bytes], { type: mimeType });
}

function triggerDownload(url: string, fileName: string): void {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = "noopener";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
}

function isNativePlatform(): boolean {
  return Capacitor.getPlatform() !== "web";
}

export function canPreviewMediaRecord(record: MediaBinaryRecord): boolean {
  return Boolean(record.previewUrl || record.dataBase64);
}

export function buildPreviewUrl(record: MediaBinaryRecord): string {
  if (record.previewUrl?.trim()) {
    return record.previewUrl;
  }
  return `data:${normalizedMimeType(record)};base64,${ensureBase64(record)}`;
}

export async function previewMediaRecord(record: MediaBinaryRecord): Promise<void> {
  const previewUrl = buildPreviewUrl(record);
  window.open(previewUrl, "_blank", "noopener,noreferrer");
}

export async function downloadMediaRecord(record: MediaBinaryRecord): Promise<string> {
  const fileName = suggestedFileName(record);
  const mimeType = normalizedMimeType(record);
  const dataBase64 = ensureBase64(record);

  if (isNativePlatform()) {
    const result = await Filesystem.writeFile({
      path: `downloads/${fileName}`,
      data: dataBase64,
      directory: Directory.Documents,
      recursive: true,
    });
    return result.uri;
  }

  const blob = base64ToBlob(dataBase64, mimeType);
  const objectUrl = URL.createObjectURL(blob);
  triggerDownload(objectUrl, fileName);
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
  return fileName;
}

export async function shareMediaRecord(record: MediaBinaryRecord): Promise<void> {
  const fileName = suggestedFileName(record);
  const mimeType = normalizedMimeType(record);
  const dataBase64 = ensureBase64(record);

  if (isNativePlatform()) {
    const result = await Filesystem.writeFile({
      path: `shared/${fileName}`,
      data: dataBase64,
      directory: Directory.Cache,
      recursive: true,
    });
    await Share.share({
      title: record.name,
      dialogTitle: record.name,
      files: [result.uri],
    });
    return;
  }

  const blob = base64ToBlob(dataBase64, mimeType);
  const sharedFile = new File([blob], fileName, { type: mimeType });
  if (typeof navigator !== "undefined" && "share" in navigator) {
    const sharePayload = { title: record.name, files: [sharedFile] };
    if (typeof navigator.canShare !== "function" || navigator.canShare(sharePayload)) {
      await navigator.share(sharePayload);
      return;
    }
  }

  const objectUrl = URL.createObjectURL(blob);
  triggerDownload(objectUrl, fileName);
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}
