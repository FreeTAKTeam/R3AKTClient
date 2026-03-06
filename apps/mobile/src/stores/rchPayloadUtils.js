function hasOwn(value, key) {
    return Object.prototype.hasOwnProperty.call(value, key);
}
export function asRecord(value) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
        return value;
    }
    return {};
}
export function asArray(value) {
    return Array.isArray(value) ? value : [];
}
export function readValue(value, keys) {
    for (const key of keys) {
        if (hasOwn(value, key)) {
            return value[key];
        }
    }
    return undefined;
}
export function readString(value, keys) {
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
export function readNumber(value, keys) {
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
export function readBoolean(value, keys) {
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
export function readStringArray(value, keys) {
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
export function readRecord(value, keys) {
    return asRecord(readValue(value, keys));
}
export function mergeRecordMap(target, entries, key) {
    for (const entry of entries) {
        const id = entry[key];
        if (typeof id !== "string" || !id) {
            continue;
        }
        target[id] = entry;
    }
}
export function replaceRecordMap(target, entries, key) {
    const nextIds = new Set();
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
