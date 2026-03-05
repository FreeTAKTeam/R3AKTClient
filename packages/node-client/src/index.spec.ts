import { describe, expect, it } from "vitest";

import {
  MESSAGES_OPERATIONS,
  SESSION_OPERATIONS,
  type ChatEvent,
  createReticulumNodeClient,
  createRchClient,
  type DomainEventPayload,
  type LogLevel,
  type NodeClientEvents,
  type NodeConfig,
  type ServiceStatus,
  type NodeStatus,
  type ReticulumNodeClient,
  type RchEnvelope,
} from "./index";

class FakeNodeClient implements ReticulumNodeClient {
  private listeners = new Map<string, Set<(payload: unknown) => void>>();

  lastEnvelope: RchEnvelope<unknown> | null = null;
  allEnvelopes: RchEnvelope<unknown>[] = [];
  failExecuteCount = 0;

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

  async getServiceStatus(): Promise<ServiceStatus> {
    return {
      state: "Running",
      running: true,
      foreground: true,
      droppedEvents: 0,
      updatedAtMs: Date.now(),
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
    this.allEnvelopes.push(envelope as RchEnvelope<unknown>);
    if (this.failExecuteCount > 0) {
      this.failExecuteCount -= 1;
      throw new Error("simulated execute failure");
    }
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

  it("exposes additive service lifecycle API on web client", async () => {
    const client = createReticulumNodeClient({ mode: "web" });
    const states: string[] = [];
    const unsubscribe = client.on("serviceStateChanged", (event) => {
      states.push(event.service.state);
    });

    const initial = await client.getServiceStatus();
    expect(initial.state).toBe("Created");

    await client.start({
      name: "web-client",
      tcpClients: [],
      broadcast: true,
      announceIntervalSeconds: 30,
      announceCapabilities: "R3AKT,EMergencyMessages",
      hubMode: "Disabled",
      hubRefreshIntervalSeconds: 300,
    });

    const running = await client.getServiceStatus();
    expect(running.state).toBe("Running");
    expect(running.running).toBe(true);
    expect(states).toContain("Foreground");
    expect(states).toContain("Running");

    await client.stop();
    const stopped = await client.getServiceStatus();
    expect(stopped.state).toBe("Stopped");
    expect(stopped.running).toBe(false);

    unsubscribe();
  });

  it("uses chat send fallback policy opportunistic -> propagated", async () => {
    const fake = new FakeNodeClient();
    fake.failExecuteCount = 1;
    const client = createRchClient(fake);

    const response = await client.chat.sendMessage({
      content: "hello",
      destination: "aa11bb22cc33dd44ee55ff66aa77bb88",
      sendMethod: "opportunistic",
      tryPropagationOnFail: true,
    });

    expect(fake.allEnvelopes.length).toBe(2);
    expect(fake.allEnvelopes[0]?.type).toBe("POST /Message");
    expect((fake.allEnvelopes[1]?.payload as Record<string, unknown>).method).toBe(
      "propagated",
    );
    expect(response.payload.sendMethod).toBe("propagated");
  });

  it("emits ordered, de-duped chat events from domain events", async () => {
    const fake = new FakeNodeClient();
    const client = createRchClient(fake);
    const observed: ChatEvent[] = [];
    const unsubscribe = client.on("chatEvent", (event) => {
      observed.push(event);
    });

    fake.emitDomainEvent({
      eventType: "message.receive",
      payloadJson:
        "{\"networkMessageId\":\"net-1\",\"localMessageId\":\"loc-1\",\"content\":\"incoming\",\"source\":\"abcd\"}",
      correlationId: "corr-1",
    });
    fake.emitDomainEvent({
      eventType: "message.receive",
      payloadJson:
        "{\"networkMessageId\":\"net-1\",\"localMessageId\":\"loc-1\",\"content\":\"incoming duplicate\"}",
      correlationId: "corr-1",
    });
    fake.emitDomainEvent({
      eventType: "message.delivery",
      payloadJson:
        "{\"localMessageId\":\"loc-1\",\"networkMessageId\":\"net-1\",\"state\":\"delivered\"}",
      correlationId: "corr-1",
    });

    expect(observed.length).toBe(2);
    expect(observed[0]?.type).toBe("message.receive");
    expect(observed[0]?.meta.sequence).toBe(1);
    expect(observed[1]?.type).toBe("message.delivery");
    expect(observed[1]?.meta.sequence).toBe(2);

    unsubscribe();
  });
});
