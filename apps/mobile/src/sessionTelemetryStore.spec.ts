import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";

import { useDiscoverySessionStore } from "./stores/discoverySessionStore";
import { useRchClientStore } from "./stores/rchClientStore";
import { useTelemetryStore } from "./stores/telemetryStore";

describe("session and telemetry parity stores", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it("hydrates session app info and client cache from focused wrapper methods", async () => {
    const rchClientStore = useRchClientStore();
    rchClientStore.requireClient = async () =>
      ({
        session: {
          execute: async (operation: string) => ({
            api_version: "1.0",
            message_id: `session-${operation}`,
            correlation_id: `session-${operation}`,
            kind: "result",
            type: operation,
            issuer: "mock",
            issued_at: "2026-03-09T00:00:00Z",
            payload:
              operation === "getAppInfo"
                ? {
                  app_name: "R3AKT",
                  version: "0.1.0",
                  status: "ready",
                }
                : {
                  clients: [
                    {
                      destinationHex: "abcd1234",
                      label: "Alpha Client",
                      state: "connected",
                    },
                  ],
                },
          }),
        },
      }) as never;

    const store = useDiscoverySessionStore();
    await store.loadAppInfo();
    await store.loadClients();

    expect(store.appInfoSummary).toContain("R3AKT");
    expect(store.clients[0]?.destination).toBe("abcd1234");
    expect(store.responseHistory).toHaveLength(2);
  });

  it("keeps join responses as accepted-until-confirmed session commands", async () => {
    const rchClientStore = useRchClientStore();
    rchClientStore.requireClient = async () =>
      ({
        session: {
          execute: async (operation: string) => ({
            api_version: "1.0",
            message_id: `session-${operation}`,
            correlation_id: `session-${operation}`,
            kind: "result",
            type: operation,
            issuer: "mock",
            issued_at: "2026-03-09T00:00:00Z",
            payload: {
              status: "accepted",
            },
          }),
        },
      }) as never;

    const store = useDiscoverySessionStore();
    await store.joinHub({ identity: "alpha" });

    expect(store.sessionStatusLabel).toContain("awaiting confirmation");
  });

  it("records telemetry request history and snapshot cache", async () => {
    const rchClientStore = useRchClientStore();
    rchClientStore.requireClient = async () =>
      ({
        telemetry: {
          execute: async (operation: string, payload: unknown) => ({
            api_version: "1.0",
            message_id: `telemetry-${operation}`,
            correlation_id: `telemetry-${operation}`,
            kind: "result",
            type: operation,
            issuer: "mock",
            issued_at: "2026-03-09T00:00:00Z",
            payload: {
              telemetry: [
                {
                  snapshot_id: "snapshot-1",
                  title: "Alpha Telemetry",
                  status: "nominal",
                  timestamp: "2026-03-09T00:00:00Z",
                },
              ],
              request: payload,
            },
          }),
        },
      }) as never;

    const store = useTelemetryStore();
    await store.requestTelemetry({ since: "2026-03-09T00:00:00Z" });

    expect(store.history).toHaveLength(1);
    expect(store.snapshots[0]?.snapshotId).toBe("snapshot-1");
    expect(store.lastRequestPayloadJson).toContain("since");
  });

  it("marks telemetry wiring without issuing an eager hub request", async () => {
    const rchClientStore = useRchClientStore();
    let executeCount = 0;
    rchClientStore.requireClient = async () =>
      ({
        telemetry: {
          execute: async () => {
            executeCount += 1;
            return {
              api_version: "1.0",
              message_id: "telemetry-wire",
              correlation_id: "telemetry-wire",
              kind: "result",
              type: "TelemetryRequest",
              issuer: "mock",
              issued_at: "2026-03-09T00:00:00Z",
              payload: {},
            };
          },
        },
      }) as never;

    const store = useTelemetryStore();
    await store.wire();

    expect(store.wired).toBe(true);
    expect(executeCount).toBe(0);
    expect(store.history).toHaveLength(0);
  });
});
