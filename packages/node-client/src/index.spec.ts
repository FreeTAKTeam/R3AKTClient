import { describe, expect, it } from "vitest";

import {
  MESSAGES_OPERATIONS,
  SESSION_OPERATIONS,
  createRchClient,
  type DomainEventPayload,
  type LogLevel,
  type NodeClientEvents,
  type NodeConfig,
  type NodeStatus,
  type ReticulumNodeClient,
  type RchEnvelope,
} from "./index";

class FakeNodeClient implements ReticulumNodeClient {
  private listeners = new Map<string, Set<(payload: unknown) => void>>();

  lastEnvelope: RchEnvelope<unknown> | null = null;

  async start(_config: NodeConfig): Promise<void> {}

  async stop(): Promise<void> {}

  async restart(_config: NodeConfig): Promise<void> {}

  async getStatus(): Promise<NodeStatus> {
    return {
      running: true,
      name: "fake",
      identityHex: "a".repeat(32),
      appDestinationHex: "b".repeat(32),
      lxmfDestinationHex: "c".repeat(32),
    };
  }

  async connectPeer(_destinationHex: string): Promise<void> {}

  async disconnectPeer(_destinationHex: string): Promise<void> {}

  async sendBytes(_destinationHex: string, _bytes: Uint8Array): Promise<void> {}

  async broadcastBytes(_bytes: Uint8Array): Promise<void> {}

  async setAnnounceCapabilities(_capabilityString: string): Promise<void> {}

  async setLogLevel(_level: LogLevel): Promise<void> {}

  async refreshHubDirectory(): Promise<void> {}

  async executeEnvelope<TPayload = unknown, TResult = unknown>(
    envelope: RchEnvelope<TPayload>,
  ): Promise<RchEnvelope<TResult>> {
    this.lastEnvelope = envelope as RchEnvelope<unknown>;
    return {
      ...envelope,
      kind: "result",
      issuer: "mobile-runtime",
      payload: {
        ok: true,
      } as TResult,
    };
  }

  on<K extends keyof NodeClientEvents>(
    event: K,
    handler: (payload: NodeClientEvents[K]) => void,
  ): () => void {
    const key = String(event);
    const bucket =
      this.listeners.get(key) ?? new Set<(payload: unknown) => void>();
    bucket.add(handler as (payload: unknown) => void);
    this.listeners.set(key, bucket);
    return () => {
      bucket.delete(handler as (payload: unknown) => void);
      if (bucket.size === 0) {
        this.listeners.delete(key);
      }
    };
  }

  emitDomainEvent(payload: DomainEventPayload): void {
    for (const handler of this.listeners.get("domainEvent") ?? []) {
      handler(payload);
    }
  }

  async dispose(): Promise<void> {
    this.listeners.clear();
  }
}

describe("RchClient grouped feature API", () => {
  it("builds query envelopes for GET operations", async () => {
    const fake = new FakeNodeClient();
    const client = createRchClient(fake);

    await client.session.execute(SESSION_OPERATIONS[0], { probe: true });

    expect(fake.lastEnvelope).not.toBeNull();
    expect(fake.lastEnvelope?.kind).toBe("query");
    expect(fake.lastEnvelope?.type).toBe(SESSION_OPERATIONS[0]);
    expect(fake.lastEnvelope?.payload).toEqual({ probe: true });
  });

  it("builds command envelopes for mutating operations", async () => {
    const fake = new FakeNodeClient();
    const client = createRchClient(fake);

    const operation =
      MESSAGES_OPERATIONS.find((candidate) => candidate.startsWith("POST")) ??
      MESSAGES_OPERATIONS[0];

    await client.messages.execute(operation, { body: "hello" });

    expect(fake.lastEnvelope).not.toBeNull();
    expect(fake.lastEnvelope?.kind).toBe(
      operation.startsWith("GET") ? "query" : "command",
    );
    expect(fake.lastEnvelope?.type).toBe(operation);
  });

  it("forwards domain events through grouped client emitter", async () => {
    const fake = new FakeNodeClient();
    const client = createRchClient(fake);

    let observed: DomainEventPayload | null = null;
    const unsubscribe = client.on("domainEvent", (payload) => {
      observed = payload;
    });

    fake.emitDomainEvent({
      eventType: "GET /Status",
      payloadJson: "{\"ok\":true}",
      correlationId: "corr-1",
    });

    expect(observed).not.toBeNull();
    expect(observed?.eventType).toBe("GET /Status");

    unsubscribe();
  });

  it("rejects feature-group operation mismatches", async () => {
    const fake = new FakeNodeClient();
    const client = createRchClient(fake);

    await expect(
      client.session.execute(MESSAGES_OPERATIONS[0] as never, {}),
    ).rejects.toThrow(/feature group allowlist/);
  });
});
