<script setup lang="ts">
import type { ChatMessage } from "@reticulum/node-client";
import { computed, onMounted, ref } from "vue";

import { buildChannelKey, useMessagingStore } from "../../stores/messagingStore";

const messaging = useMessagingStore();

const destinationInput = ref("");
const topicInput = ref("");

const draftModel = computed({
  get: () => messaging.activeDraft,
  set: (value: string) => messaging.setDraft(value),
});

const derivedChannelKey = computed(() => {
  const topicId = topicInput.value.trim();
  const destination = destinationInput.value.trim().toLowerCase();
  if (topicId || destination) {
    return buildChannelKey({
      topicId: topicId || undefined,
      destination: destination || undefined,
    });
  }
  return messaging.activeChannelKey;
});

onMounted(() => {
  messaging.wire().catch(() => undefined);
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

function imagePreview(message: ChatMessage): string | null {
  const dataBase64 = typeof message.image?.data_base64 === "string"
    ? message.image.data_base64
    : null;
  if (!dataBase64) {
    return null;
  }
  const mimeType = typeof message.image?.mime_type === "string"
    ? message.image.mime_type
    : "image/*";
  return `data:${mimeType};base64,${dataBase64}`;
}

function chooseChannel(channelKey: string): void {
  messaging.setActiveChannel(channelKey);
  destinationInput.value = "";
  topicInput.value = "";
}

function openDerivedChannel(): void {
  messaging.setActiveChannel(derivedChannelKey.value);
}

async function sendCurrentDraft(): Promise<void> {
  await messaging.sendDraft({
    channelKey: derivedChannelKey.value,
    destination: destinationInput.value.trim() || undefined,
    topicId: topicInput.value.trim() || undefined,
  });
}
</script>

<template>
  <section class="chat-panel">
    <header class="panel-header">
      <div class="title-wrap">
        <h2 class="panel-title">Comms Chat</h2>
        <p class="panel-subtitle">Mission-sync LXMF channels with local queued/failed state only.</p>
      </div>
      <div class="status-pills">
        <span class="status-pill" :class="{ ready: messaging.capabilities.messageSend }">send</span>
        <span class="status-pill" :class="{ ready: messaging.capabilities.topicList }">list</span>
        <span class="status-pill" :class="{ ready: messaging.capabilities.topicSubscribe }">subscribe</span>
      </div>
    </header>

    <p v-if="messaging.lastError" class="error-banner">{{ messaging.lastError }}</p>

    <section class="chat-grid">
      <aside class="channels">
        <h3 class="section-title">Channels</h3>
        <button
          v-for="channel in messaging.channels"
          :key="channel.channelKey"
          class="channel-button"
          :class="{ active: channel.channelKey === messaging.activeChannelKey }"
          type="button"
          @click="chooseChannel(channel.channelKey)"
        >
          <span>{{ channel.title }}</span>
        </button>
      </aside>

      <div class="timeline-wrap">
        <header class="timeline-header">
          <div class="status-row">
            <span>Queued: {{ messaging.queuedCount }}</span>
            <span>Failed: {{ messaging.failedCount }}</span>
            <span>Ready: {{ messaging.ready ? "yes" : "no" }}</span>
          </div>
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
              <span>{{ message.direction }}</span>
              <span>{{ message.deliveryState }}</span>
            </header>
            <p class="message-content">{{ message.content || "(empty message)" }}</p>
            <div
              v-if="message.attachments?.length"
              class="attachment-list"
            >
              <span
                v-for="attachment in message.attachments"
                :key="attachment.id"
                class="attachment-chip"
              >
                {{ attachment.name }}
              </span>
            </div>
            <img
              v-if="imagePreview(message)"
              class="image-preview"
              :src="imagePreview(message) ?? undefined"
              alt="Attached image preview"
            />
            <p v-if="message.topicId || message.destination" class="message-route">
              {{ message.topicId ? `topic:${message.topicId}` : `dm:${message.destination}` }}
            </p>
            <p v-if="message.error" class="message-error">{{ message.error }}</p>
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
                @blur="openDerivedChannel"
              />
            </label>
            <label class="input-label">
              Topic
              <input
                v-model="topicInput"
                class="text-input"
                type="text"
                placeholder="topic id"
                @blur="openDerivedChannel"
              />
            </label>
            <button class="open-button" type="button" @click="openDerivedChannel">
              Open Channel
            </button>
          </div>
          <textarea
            v-model="draftModel"
            class="composer-input"
            rows="3"
            placeholder="Type message..."
          />
          <div class="composer-actions">
            <button class="send-button" type="button" :disabled="!messaging.ready" @click="sendCurrentDraft">
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

.status-pills {
  display: flex;
  gap: 0.4rem;
}

.status-pill,
.open-button,
.send-button {
  background: rgb(10 28 55 / 92%);
  border: 1px solid rgb(106 177 238 / 44%);
  border-radius: 10px;
  color: #d3ecff;
  cursor: pointer;
  font-family: var(--font-ui);
  padding: 0.45rem 0.8rem;
}

.status-pill {
  cursor: default;
  opacity: 0.45;
  text-transform: uppercase;
}

.status-pill.ready {
  opacity: 1;
}

.error-banner {
  background: rgb(64 15 22 / 72%);
  border: 1px solid rgb(230 110 126 / 35%);
  border-radius: 12px;
  color: #ffd7df;
  font-family: var(--font-body);
  margin: 0;
  padding: 0.8rem;
}

.chat-grid {
  display: grid;
  gap: 0.8rem;
  grid-template-columns: 220px minmax(0, 1fr);
}

.channels {
  background: rgb(7 20 43 / 74%);
  border: 1px solid rgb(88 128 179 / 34%);
  border-radius: 14px;
  display: grid;
  gap: 0.5rem;
  padding: 0.7rem;
}

.section-title {
  color: #d6ecff;
  font-family: var(--font-ui);
  font-size: 0.82rem;
  letter-spacing: 0.08em;
  margin: 0;
  text-transform: uppercase;
}

.channel-button {
  background: rgb(3 12 29 / 84%);
  border: 1px solid rgb(82 126 181 / 28%);
  border-radius: 10px;
  color: #c7e1fa;
  cursor: pointer;
  font-family: var(--font-body);
  padding: 0.6rem;
  text-align: left;
}

.channel-button.active {
  background: linear-gradient(135deg, rgb(22 55 99 / 96%), rgb(11 27 55 / 94%));
  border-color: rgb(112 181 239 / 58%);
  color: #eff8ff;
}

.timeline-wrap {
  background: rgb(7 20 43 / 74%);
  border: 1px solid rgb(88 128 179 / 34%);
  border-radius: 14px;
  display: grid;
  gap: 0.7rem;
  padding: 0.8rem;
}

.timeline-header {
  align-items: center;
  display: flex;
  justify-content: space-between;
}

.status-row {
  color: #9bc0e6;
  display: flex;
  flex-wrap: wrap;
  font-family: var(--font-ui);
  font-size: 0.76rem;
  gap: 0.65rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.timeline {
  display: grid;
  gap: 0.55rem;
  max-height: 420px;
  overflow: auto;
}

.message-card {
  background: rgb(4 14 31 / 84%);
  border: 1px solid rgb(78 118 171 / 28%);
  border-radius: 12px;
  display: grid;
  gap: 0.25rem;
  padding: 0.65rem;
}

.message-card.direction-outbound {
  border-color: rgb(101 170 232 / 36%);
}

.message-card.state-failed {
  border-color: rgb(229 116 132 / 44%);
}

.message-card.state-queued {
  border-color: rgb(224 195 102 / 42%);
}

.message-meta {
  color: #8eb4da;
  display: flex;
  font-family: var(--font-ui);
  font-size: 0.72rem;
  gap: 0.6rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.message-content {
  color: #eff8ff;
  font-family: var(--font-body);
  margin: 0;
}

.message-route,
.message-error,
.attachment-list {
  font-family: var(--font-body);
  margin: 0;
}

.message-route {
  color: #9ac1e8;
  font-size: 0.8rem;
}

.attachment-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.attachment-chip {
  background: rgb(14 42 69 / 72%);
  border: 1px solid rgb(92 148 201 / 28%);
  border-radius: 999px;
  color: #cceaff;
  font-family: var(--font-ui);
  font-size: 0.68rem;
  letter-spacing: 0.05em;
  padding: 0.2rem 0.45rem;
  text-transform: uppercase;
}

.image-preview {
  border: 1px solid rgb(92 148 201 / 28%);
  border-radius: 12px;
  max-height: 180px;
  max-width: min(100%, 260px);
  object-fit: cover;
}

.message-error {
  color: #ffb8c4;
  font-size: 0.8rem;
}

.composer {
  display: grid;
  gap: 0.65rem;
}

.routing-grid {
  display: grid;
  gap: 0.5rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.input-label {
  color: #9bbde2;
  display: grid;
  font-family: var(--font-ui);
  font-size: 0.7rem;
  gap: 0.25rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.text-input,
.composer-input {
  background: rgb(3 12 28 / 90%);
  border: 1px solid rgb(84 130 185 / 35%);
  border-radius: 9px;
  color: #d9ecff;
  font-family: var(--font-body);
  padding: 0.45rem 0.5rem;
}

.composer-input {
  resize: vertical;
}

.composer-actions {
  display: flex;
  justify-content: flex-end;
}

.send-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

@media (max-width: 900px) {
  .panel-header,
  .timeline-header {
    align-items: start;
    flex-direction: column;
  }

  .chat-grid,
  .routing-grid {
    grid-template-columns: 1fr;
  }

  .status-pills,
  .status-row {
    flex-wrap: wrap;
  }
}
</style>
