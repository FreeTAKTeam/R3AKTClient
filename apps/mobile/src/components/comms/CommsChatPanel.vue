<script setup lang="ts">
import type { SendMethod } from "@reticulum/node-client";
import { computed, onMounted, ref } from "vue";

import { useMessagingStore } from "../../stores/messagingStore";

const messaging = useMessagingStore();

const destinationInput = ref("");
const topicInput = ref("");
const sendMethod = ref<SendMethod>("opportunistic");

const draftModel = computed({
  get: () => messaging.activeDraft,
  set: (value: string) => messaging.setDraft(value),
});

const derivedConversationId = computed(() => {
  const topicId = topicInput.value.trim();
  if (topicId) {
    return `topic:${topicId}`;
  }
  const destination = destinationInput.value.trim().toLowerCase();
  if (destination) {
    return `dm:${destination}`;
  }
  return messaging.activeConversationId;
});

onMounted(() => {
  if (messaging.chatV2Enabled) {
    messaging.wire().catch(() => undefined);
  }
});

function formatTimestamp(value: string): string {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return value;
  }
  return new Date(parsed).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function chooseConversation(conversationId: string): void {
  messaging.setActiveConversation(conversationId);
  destinationInput.value = "";
  topicInput.value = "";
}

function openDerivedConversation(): void {
  messaging.setActiveConversation(derivedConversationId.value);
}

async function sendCurrentDraft(): Promise<void> {
  await messaging.sendDraft({
    conversationId: derivedConversationId.value,
    destination: destinationInput.value.trim() || undefined,
    topicId: topicInput.value.trim() || undefined,
    sendMethod: sendMethod.value,
    tryPropagationOnFail: true,
  });
}

async function retryMessage(localMessageId: string): Promise<void> {
  await messaging.retryMessage(localMessageId, sendMethod.value);
}

async function syncMessages(): Promise<void> {
  await messaging.syncMessages({ replayLimit: 200 });
}

async function react(localMessageId: string, key: string): Promise<void> {
  await messaging.sendReaction(localMessageId, key).catch(() => undefined);
}

function toggleChatV2(): void {
  const next = !messaging.chatV2Enabled;
  messaging.setChatV2Enabled(next);
  if (next) {
    messaging.wire().catch(() => undefined);
  }
}
</script>

<template>
  <section class="chat-panel">
    <header class="panel-header">
      <div class="title-wrap">
        <h2 class="panel-title">Comms Chat</h2>
        <p class="panel-subtitle">Queued send + runtime delivery reconciliation.</p>
      </div>
      <button class="toggle-button" type="button" @click="toggleChatV2">
        {{ messaging.chatV2Enabled ? "Disable chat_v2" : "Enable chat_v2" }}
      </button>
    </header>

    <section v-if="!messaging.chatV2Enabled" class="disabled-state">
      <p>chat_v2 is disabled. Enable it to use Columba-equivalent chat behavior.</p>
    </section>

    <section v-else class="chat-grid">
      <aside class="conversations">
        <h3 class="section-title">Conversations</h3>
        <button
          v-for="conversation in messaging.conversations"
          :key="conversation.id"
          class="conversation-button"
          :class="{ active: conversation.id === messaging.activeConversationId }"
          type="button"
          @click="chooseConversation(conversation.id)"
        >
          <span>{{ conversation.title }}</span>
        </button>
      </aside>

      <div class="timeline-wrap">
        <header class="timeline-header">
          <div class="status-row">
            <span>Queued: {{ messaging.queuedCount }}</span>
            <span>Failed: {{ messaging.failedCount }}</span>
            <span>Reconnects: {{ messaging.telemetry.reconnectCount }}</span>
            <span>Dedupe: {{ messaging.telemetry.duplicateSuppressed }}</span>
          </div>
          <button class="sync-button" type="button" @click="syncMessages">
            Sync
          </button>
        </header>

        <div class="timeline">
          <article
            v-for="message in messaging.activeMessages"
            :key="message.localMessageId"
            class="message-card"
            :class="[`state-${message.deliveryState}`, `direction-${message.direction}`]"
          >
            <header class="message-meta">
              <span>{{ formatTimestamp(message.issuedAt) }}</span>
              <span>{{ message.sendMethod }}</span>
              <span>{{ message.deliveryState }}</span>
            </header>
            <p class="message-content">{{ message.content || "(empty message)" }}</p>
            <footer class="message-actions">
              <button type="button" @click="react(message.localMessageId, '👍')">👍</button>
              <button type="button" @click="react(message.localMessageId, '✅')">✅</button>
              <button
                v-if="message.deliveryState === 'failed'"
                type="button"
                @click="retryMessage(message.localMessageId)"
              >
                Retry
              </button>
            </footer>
          </article>
        </div>

        <footer class="composer">
          <div class="routing-grid">
            <label class="input-label">
              Destination
              <input
                v-model="destinationInput"
                class="text-input"
                type="text"
                placeholder="destination hex"
                @blur="openDerivedConversation"
              />
            </label>
            <label class="input-label">
              Topic
              <input
                v-model="topicInput"
                class="text-input"
                type="text"
                placeholder="topic id"
                @blur="openDerivedConversation"
              />
            </label>
            <label class="input-label">
              Method
              <select v-model="sendMethod" class="text-input">
                <option value="direct">direct</option>
                <option value="opportunistic">opportunistic</option>
                <option value="propagated">propagated</option>
              </select>
            </label>
          </div>
          <textarea
            v-model="draftModel"
            class="composer-input"
            rows="3"
            placeholder="Type message..."
          />
          <div class="composer-actions">
            <button class="send-button" type="button" @click="sendCurrentDraft">
              Send
            </button>
          </div>
        </footer>
      </div>
    </section>
  </section>
</template>

<style scoped>
.chat-panel {
  display: grid;
  gap: 0.8rem;
}

.panel-header {
  align-items: center;
  display: flex;
  gap: 0.8rem;
  justify-content: space-between;
}

.title-wrap {
  display: grid;
  gap: 0.2rem;
}

.panel-title {
  font-family: var(--font-headline);
  font-size: 1.3rem;
  margin: 0;
}

.panel-subtitle {
  color: #8ca7d0;
  font-family: var(--font-body);
  font-size: 0.84rem;
  margin: 0;
}

.toggle-button,
.sync-button,
.send-button {
  background: rgb(10 28 55 / 92%);
  border: 1px solid rgb(106 177 238 / 44%);
  border-radius: 10px;
  color: #d3ecff;
  cursor: pointer;
  font-family: var(--font-ui);
  padding: 0.45rem 0.8rem;
}

.disabled-state {
  background: rgb(8 22 45 / 74%);
  border: 1px solid rgb(92 130 178 / 35%);
  border-radius: 12px;
  color: #97b7dd;
  font-family: var(--font-body);
  padding: 0.8rem;
}

.chat-grid {
  display: grid;
  gap: 0.8rem;
  grid-template-columns: 220px minmax(0, 1fr);
}

.conversations,
.timeline-wrap {
  background: rgb(7 20 43 / 72%);
  border: 1px solid rgb(83 125 185 / 32%);
  border-radius: 12px;
  padding: 0.7rem;
}

.section-title {
  color: #d8ecff;
  font-family: var(--font-ui);
  font-size: 0.85rem;
  letter-spacing: 0.08em;
  margin: 0 0 0.5rem;
  text-transform: uppercase;
}

.conversation-button {
  background: transparent;
  border: 1px solid rgb(88 129 182 / 28%);
  border-radius: 10px;
  color: #b2d4f5;
  cursor: pointer;
  display: block;
  font-family: var(--font-body);
  margin-bottom: 0.4rem;
  padding: 0.45rem 0.5rem;
  text-align: left;
  width: 100%;
}

.conversation-button.active {
  border-color: rgb(105 191 245 / 72%);
  color: #ebf8ff;
}

.timeline-wrap {
  display: grid;
  gap: 0.7rem;
}

.timeline-header {
  align-items: center;
  display: flex;
  justify-content: space-between;
}

.status-row {
  color: #9dbede;
  display: flex;
  flex-wrap: wrap;
  font-family: var(--font-body);
  font-size: 0.72rem;
  gap: 0.7rem;
}

.timeline {
  display: grid;
  gap: 0.5rem;
  max-height: 320px;
  overflow: auto;
}

.message-card {
  border: 1px solid rgb(84 124 179 / 24%);
  border-radius: 10px;
  display: grid;
  gap: 0.45rem;
  padding: 0.55rem;
}

.message-card.direction-outbound {
  background: rgb(10 31 59 / 70%);
}

.message-card.direction-inbound {
  background: rgb(16 29 45 / 72%);
}

.message-card.state-failed {
  border-color: rgb(224 106 106 / 60%);
}

.message-meta {
  color: #95b4d8;
  display: flex;
  font-family: var(--font-ui);
  font-size: 0.68rem;
  gap: 0.6rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.message-content {
  color: #e6f3ff;
  font-family: var(--font-body);
  margin: 0;
  white-space: pre-wrap;
}

.message-actions {
  display: flex;
  gap: 0.4rem;
}

.message-actions button {
  background: rgb(14 34 61 / 85%);
  border: 1px solid rgb(97 147 201 / 38%);
  border-radius: 8px;
  color: #cbe7ff;
  cursor: pointer;
  font-family: var(--font-ui);
  font-size: 0.73rem;
  padding: 0.25rem 0.5rem;
}

.composer {
  display: grid;
  gap: 0.55rem;
}

.routing-grid {
  display: grid;
  gap: 0.45rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.input-label {
  color: #97b9de;
  display: grid;
  font-family: var(--font-ui);
  font-size: 0.7rem;
  gap: 0.25rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.text-input,
.composer-input {
  background: rgb(2 11 27 / 90%);
  border: 1px solid rgb(81 131 187 / 30%);
  border-radius: 9px;
  color: #d9efff;
  font-family: var(--font-body);
  padding: 0.45rem 0.5rem;
}

.composer-actions {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 900px) {
  .chat-grid {
    grid-template-columns: 1fr;
  }
}
</style>
