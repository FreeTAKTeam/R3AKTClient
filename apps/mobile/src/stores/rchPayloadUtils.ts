type UnknownRecord = Record<string, unknown>;

function hasOwn(value: UnknownRecord, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

export function asRecord(value: unknown): UnknownRecord {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as UnknownRecord;
  }
  return {};
}

export function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function readValue(value: UnknownRecord, keys: readonly string[]): unknown {
  for (const key of keys) {
    if (hasOwn(value, key)) {
      return value[key];
    }
  }
  return undefined;
}

export function readString(value: UnknownRecord, keys: readonly string[]): string | undefined {
  const raw = readValue(value, keys);
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    return trimmed || undefined;
  }
  if (typeof raw === "number") {
    return String(raw);
  }
  return undefined;
}

export function readNumber(value: UnknownRecord, keys: readonly string[]): number | undefined {
  const raw = readValue(value, keys);
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return raw;
  }
  if (typeof raw === "string") {
    const parsed = Number(raw);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
}

export function readBoolean(value: UnknownRecord, keys: readonly string[]): boolean | undefined {
  const raw = readValue(value, keys);
  if (typeof raw === "boolean") {
    return raw;
  }
  if (typeof raw === "string") {
    const normalized = raw.trim().toLowerCase();
    if (normalized === "true" || normalized === "1" || normalized === "yes") {
      return true;
    }
    if (normalized === "false" || normalized === "0" || normalized === "no") {
      return false;
    }
  }
  return undefined;
}

export function readStringArray(value: UnknownRecord, keys: readonly string[]): string[] {
  const raw = readValue(value, keys);
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((entry) => {
      if (typeof entry === "string") {
        return entry.trim();
      }
      if (typeof entry === "number") {
        return String(entry);
      }
      return "";
    })
    .filter((entry) => entry.length > 0);
}

export function readRecord(value: UnknownRecord, keys: readonly string[]): UnknownRecord {
  return asRecord(readValue(value, keys));
}

export function mergeRecordMap<T extends object, K extends keyof T>(
  target: Record<string, T>,
  entries: readonly T[],
  key: K,
): void {
  for (const entry of entries) {
    const id = entry[key];
    if (typeof id !== "string" || !id) {
      continue;
    }
    target[id] = entry;
  }
}

export function replaceRecordMap<T extends object, K extends keyof T>(
  target: Record<string, T>,
  entries: readonly T[],
  key: K,
): void {
  const nextIds = new Set<string>();
  for (const entry of entries) {
    const id = entry[key];
    if (typeof id !== "string" || !id) {
      continue;
    }
    nextIds.add(id);
    target[id] = entry;
  }

  for (const existingId of Object.keys(target)) {
    if (!nextIds.has(existingId)) {
      delete target[existingId];
    }
  }
}
