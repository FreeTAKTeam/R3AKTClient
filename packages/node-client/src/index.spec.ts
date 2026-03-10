import { describe, expect, it } from "vitest";

import {
  CHAT_MESSAGE_SEND_OPERATION,
  CHAT_TOPIC_LIST_OPERATION,
  CHAT_TOPIC_SUBSCRIBE_OPERATION,
  MESSAGES_OPERATIONS,
  SESSION_OPERATIONS,
  type ChatEvent,
  type ChatSendResult,
  createReticulumNodeClient,
  createRchClient,
  type DomainEventPayload,
  normalizeDomainEventPayload,
  type LogLevel,
  type NodeClientEvents,
  type NodeConfig,
  type ServiceStatus,
  type SendMessageInput,
  type NodeStatus,
  type ReticulumNodeClient,
  type RchEnvelope,
} from "./index";

class FakeNodeClient implements ReticulumNodeClient {
  private listeners = new Map<string, Set<(payload: unknown) => void>>();

  lastEnvelope: RchEnvelope<unknown> | null = null;
  allEnvelopes: RchEnvelope<unknown>[] = [];
  failExecuteCount = 0;
  lastChatSendRequest: Record<string, unknown> | null = null;

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

    const payload = envelope.payload as Record<string, unknown>;
    if (envelope.type === CHAT_MESSAGE_SEND_OPERATION) {
      return {
        ...envelope,
        kind: "result",
        issuer: "mobile-runtime",
        payload: {
          local_message_id:
            payload.local_message_id ?? envelope.correlation_id ?? envelope.message_id,
          sent: true,
          content: payload.content ?? "",
          destination: payload.destination,
          topic_id: payload.topic_id,
        } as TResult,
      };
    }

    if (envelope.type === CHAT_TOPIC_SUBSCRIBE_OPERATION) {
      return {
        ...envelope,
        kind: "result",
        issuer: "mobile-runtime",
        payload: {
          topic_id: payload.topic_id,
          destination: payload.destination,
        } as TResult,
      };
    }

    if (envelope.type === CHAT_TOPIC_LIST_OPERATION) {
      return {
        ...envelope,
        kind: "result",
        issuer: "mobile-runtime",
        payload: {
          topics: [
            {
              topic_id: "ops.alerts",
              topic_name: "OPS ALERTS",
            },
          ],
        } as TResult,
      };
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

  async sendChatMessage(request: SendMessageInput): Promise<ChatSendResult> {
    this.lastChatSendRequest = {
      local_message_id: request.localMessageId ?? request.local_message_id,
      content: request.content,
      destination: request.destination,
      topic_id: request.topicId ?? request.topic_id,
    };
    this.emitDomainEvent({
      eventType: "message.sent",
      payloadJson: JSON.stringify({
        local_message_id: request.localMessageId ?? request.local_message_id,
        content: request.content,
        destination: request.destination,
        topic_id: request.topicId ?? request.topic_id,
        thread_id: request.localMessageId ?? request.local_message_id,
        group_id: request.topicId ?? request.topic_id,
        issued_at: "2026-03-06T12:00:00Z",
        sent: true,
      }),
      correlationId: String(request.localMessageId ?? request.local_message_id ?? ""),
    });
    return {
      localMessageId: String(request.localMessageId ?? request.local_message_id ?? "fake-chat-1"),
      sent: true,
      content: request.content,
      destination: request.destination,
      topicId: request.topicId ?? request.topic_id,
    };
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

    const operation = CHAT_MESSAGE_SEND_OPERATION;

    await client.messages.execute(operation, { body: "hello" });

    expect(fake.lastEnvelope).not.toBeNull();
    expect(fake.lastEnvelope?.kind).toBe("command");
    expect(fake.lastEnvelope?.type).toBe(operation);
  });

  it("accepts documented direct southbound command operations", async () => {
    const fake = new FakeNodeClient();
    const client = createRchClient(fake);

    await client.execute("mission.join", { identity: "abcd" });

    expect(fake.lastEnvelope).not.toBeNull();
    expect(fake.lastEnvelope?.kind).toBe("command");
    expect(fake.lastEnvelope?.type).toBe("mission.join");
    expect(fake.lastEnvelope?.payload).toEqual({ identity: "abcd" });
  });

  it("classifies documented direct southbound query operations correctly", async () => {
    const fake = new FakeNodeClient();
    const client = createRchClient(fake);

    await client.execute("checklist.template.list", { search: "alpha" });

    expect(fake.lastEnvelope).not.toBeNull();
    expect(fake.lastEnvelope?.kind).toBe("query");
    expect(fake.lastEnvelope?.type).toBe("checklist.template.list");
    expect(fake.lastEnvelope?.payload).toEqual({ search: "alpha" });
  });

  it("sends chat messages to the requested hub destination through the public chat API", async () => {
    const fake = new FakeNodeClient();
    const client = createRchClient(fake);
    const hubDestination = "c4de028671f01d9649aabb85e73b50a4";
    const topicList = await client.chat.listTopics();
    const topicId = (
      topicList.payload as {
        topics?: Array<{ topic_id?: string }>;
      }
    ).topics?.[0]?.topic_id;
    expect(topicId).toBeTruthy();

    const jokePayload =
      "Why do ravens make terrible field couriers? They keep cawing the punchline before they land.";
    const localMessageId = "client-raven-joke-1";

    const response = await client.chat.sendMessage({
      content: jokePayload,
      destination: hubDestination,
      topic_id: topicId,
      local_message_id: localMessageId,
    });

    expect(response.payload.sent).toBe(true);
    expect(fake.lastChatSendRequest).toMatchObject({
      content: jokePayload,
      destination: hubDestination,
      topic_id: topicId,
      local_message_id: localMessageId,
    });
  });

  it("forwards domain events through grouped client emitter", async () => {
    const fake = new FakeNodeClient();
    const client = createRchClient(fake);

    let observed: DomainEventPayload | null = null;
    const unsubscribe = client.on("domainEvent", (payload) => {
      observed = payload;
    });

    fake.emitDomainEvent({
      eventType: "GetStatus",
      payloadJson: "{\"ok\":true}",
      correlationId: "corr-1",
    });

    expect(observed).not.toBeNull();
    expect(observed?.eventType).toBe("GetStatus");

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

  it("normalizes domain events with derived event id and occurrence time", () => {
    const normalized = normalizeDomainEventPayload(
      {
        eventType: "mission.change.received",
        payloadJson:
          "{\"event_id\":\"evt-42\",\"issued_at\":\"2026-03-10T10:30:00Z\",\"mission_uid\":\"mission-1\"}",
        correlationId: "corr-42",
      },
      1234,
    );

    expect(normalized.eventType).toBe("mission.change.received");
    expect(normalized.eventId).toBe("evt-42");
    expect(normalized.occurredAt).toBe("2026-03-10T10:30:00Z");
    expect(normalized.receivedAtMs).toBe(1234);
    expect(normalized.dedupeKey).toBe("evt-42");
    expect(normalized.payload).toMatchObject({
      mission_uid: "mission-1",
    });
  });

  it("falls back to correlation and payload content when domain events lack ids", () => {
    const normalized = normalizeDomainEventPayload(
      {
        eventType: "rch.telemetry.response",
        payloadJson: "{\"status\":\"ok\"}",
        correlationId: "corr-fallback-1",
      },
      4567,
    );

    expect(normalized.eventId).toBeUndefined();
    expect(normalized.occurredAt).toBeUndefined();
    expect(normalized.dedupeKey).toBe("corr-fallback-1");
    expect(normalized.receivedAtMs).toBe(4567);
  });

  it("routes public chat sends through the native sender instead of executeEnvelope", async () => {
    const fake = new FakeNodeClient();
    const client = createRchClient(fake);

    const response = await client.chat.sendMessage({
      content: "hello",
      destination: "aa11bb22cc33dd44ee55ff66aa77bb88",
      topicId: "ops.alerts",
    });

    expect(fake.allEnvelopes.length).toBe(0);
    expect(fake.lastChatSendRequest).toMatchObject({
      content: "hello",
      destination: "aa11bb22cc33dd44ee55ff66aa77bb88",
      topic_id: "ops.alerts",
    });
    expect(response.payload.sent).toBe(true);
  });

  it("normalizes ingress HTTP aliases to canonical southbound commands", async () => {
    const fake = new FakeNodeClient();
    const client = createRchClient(fake);

    await client.execute("POST /Message" as never, { content: "hello" });
    expect(fake.lastEnvelope?.type).toBe("mission.message.send");
    expect(fake.lastEnvelope?.kind).toBe("command");

    await client.execute("POST /RCH" as never, { identity: "abcd" });
    expect(fake.lastEnvelope?.type).toBe("mission.join");
    expect(fake.lastEnvelope?.kind).toBe("command");
  });

  it("emits ordered, de-duped chat events from domain events", async () => {
    const fake = new FakeNodeClient();
    const client = createRchClient(fake);
    const observed: ChatEvent[] = [];
    const unsubscribe = client.on("chatEvent", (event) => {
      observed.push(event);
    });

    fake.emitDomainEvent({
      eventType: "rch.message.relay",
      payloadJson:
        "{\"event_id\":\"evt-1\",\"localMessageId\":\"loc-1\",\"content\":\"incoming\",\"source\":\"abcd\",\"source_hash\":\"abcd\",\"topic_id\":\"ops.alerts\",\"issued_at\":\"2026-03-06T12:00:00Z\"}",
      correlationId: "corr-1",
    });
    fake.emitDomainEvent({
      eventType: "rch.message.relay",
      payloadJson:
        "{\"event_id\":\"evt-1\",\"localMessageId\":\"loc-2\",\"content\":\"incoming duplicate\",\"source\":\"abcd\",\"source_hash\":\"abcd\",\"topic_id\":\"ops.alerts\",\"issued_at\":\"2026-03-06T12:00:00Z\"}",
      correlationId: "corr-1",
    });
    fake.emitDomainEvent({
      eventType: "mission.message.sent",
      payloadJson:
        "{\"local_message_id\":\"loc-3\",\"content\":\"outbound\",\"destination\":\"aa11bb22cc33dd44ee55ff66aa77bb88\",\"sent\":true}",
      correlationId: "corr-1",
    });

    expect(observed.length).toBe(2);
    expect(observed[0]?.type).toBe("message.receive");
    expect(observed[0]?.meta.sequence).toBe(1);
    expect(observed[1]?.type).toBe("message.sent");
    expect(observed[1]?.meta.sequence).toBe(2);

    unsubscribe();
  });
});
