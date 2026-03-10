import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";

import { runtimeProfile } from "../utils/runtimeProfile";

const PERSISTENCE_PREFIX = "reticulum.mobile.app";

function storageKey(namespace: string, key: string): string {
  return `${PERSISTENCE_PREFIX}:${namespace}:${key}`;
}

function prefersNativePersistence(): boolean {
  return runtimeProfile === "mobile" && Capacitor.getPlatform() !== "web";
}

async function getRawValue(namespace: string, key: string): Promise<string | null> {
  const resolvedKey = storageKey(namespace, key);
  if (prefersNativePersistence()) {
    const result = await Preferences.get({ key: resolvedKey });
    return result.value;
  }
  return localStorage.getItem(resolvedKey);
}

async function setRawValue(
  namespace: string,
  key: string,
  value: string,
): Promise<void> {
  const resolvedKey = storageKey(namespace, key);
  if (prefersNativePersistence()) {
    await Preferences.set({
      key: resolvedKey,
      value,
    });
    return;
  }
  localStorage.setItem(resolvedKey, value);
}

async function removeRawValue(namespace: string, key: string): Promise<void> {
  const resolvedKey = storageKey(namespace, key);
  if (prefersNativePersistence()) {
    await Preferences.remove({ key: resolvedKey });
    return;
  }
  localStorage.removeItem(resolvedKey);
}

export interface AppPersistenceNamespace {
  getJson<T>(key: string, fallback: T): Promise<T>;
  setJson(key: string, value: unknown): Promise<void>;
  remove(key: string): Promise<void>;
}

export function createAppPersistenceNamespace(namespace: string): AppPersistenceNamespace {
  return {
    async getJson<T>(key: string, fallback: T): Promise<T> {
      try {
        const rawValue = await getRawValue(namespace, key);
        if (!rawValue) {
          return fallback;
        }
        return JSON.parse(rawValue) as T;
      } catch {
        return fallback;
      }
    },
    async setJson(key: string, value: unknown): Promise<void> {
      await setRawValue(namespace, key, JSON.stringify(value));
    },
    async remove(key: string): Promise<void> {
      await removeRawValue(namespace, key);
    },
  };
}
