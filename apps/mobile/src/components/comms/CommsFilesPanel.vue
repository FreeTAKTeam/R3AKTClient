<script setup lang="ts">
import type { AttachmentDirection } from "@reticulum/node-client";
import { ref } from "vue";

import { useFilesMediaStore } from "../../stores/filesMediaStore";
import { useMessagingStore } from "../../stores/messagingStore";

const filesStore = useFilesMediaStore();
const messagingStore = useMessagingStore();

const direction = ref<AttachmentDirection>("upload");
const fileInput = ref<HTMLInputElement | null>(null);

function openPicker(): void {
  fileInput.value?.click();
}

async function stageTransfer(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files ?? []);
  if (files.length === 0) {
    return;
  }

  await filesStore.queueLocalFiles(files, {
    channelKey: messagingStore.activeChannelKey,
    direction: direction.value,
  });
  input.value = "";
}
</script>

<template>
  <section class="files-panel">
    <header class="panel-header">
      <div>
        <h2 class="panel-title">Comms Files and Media</h2>
        <p class="panel-subtitle">Track attachment transfer state and metadata.</p>
      </div>
    </header>

    <section class="stage-form">
      <label class="input-label">
        Active channel
        <input :value="messagingStore.activeChannelKey" class="text-input" type="text" readonly />
      </label>
      <label class="input-label">
        Direction
        <select v-model="direction" class="text-input">
          <option value="upload">upload</option>
          <option value="download">download</option>
        </select>
      </label>
      <input
        ref="fileInput"
        class="hidden-input"
        type="file"
        multiple
        @change="stageTransfer"
      />
      <button class="stage-button" type="button" @click="openPicker">
        Stage Local Files
      </button>
    </section>

    <section class="transfer-list">
      <article
        v-for="transfer in filesStore.transfers"
        :key="transfer.id"
        class="transfer-card"
        :class="`state-${transfer.state}`"
      >
        <header class="transfer-header">
          <strong>{{ transfer.name }}</strong>
          <span>{{ transfer.direction }}</span>
        </header>
        <p>{{ transfer.mimeType || "unknown mime" }} - {{ transfer.sizeBytes ?? 0 }} bytes</p>
        <img v-if="transfer.url" class="preview-image" :src="transfer.url" :alt="transfer.name" />
        <p>State: {{ transfer.state }} ({{ transfer.progressPct }}%)</p>
      </article>
      <p v-if="filesStore.transfers.length === 0" class="empty-state">
        No transfer metadata recorded.
      </p>
    </section>
  </section>
</template>

<style scoped>
.files-panel {
  display: grid;
  gap: 0.8rem;
}

.panel-title {
  font-family: var(--font-headline);
  font-size: 1.3rem;
  margin: 0;
}

.panel-subtitle {
  color: #93b2d9;
  font-family: var(--font-body);
  margin: 0.2rem 0 0;
}

.stage-form {
  background: rgb(7 20 43 / 72%);
  border: 1px solid rgb(83 125 185 / 32%);
  border-radius: 12px;
  display: grid;
  gap: 0.5rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  padding: 0.7rem;
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

.text-input {
  background: rgb(3 12 29 / 90%);
  border: 1px solid rgb(81 129 181 / 36%);
  border-radius: 9px;
  color: #daedff;
  font-family: var(--font-body);
  padding: 0.45rem 0.5rem;
}

.stage-button {
  align-self: end;
  background: rgb(10 29 56 / 92%);
  border: 1px solid rgb(97 164 226 / 44%);
  border-radius: 10px;
  color: #ddf2ff;
  cursor: pointer;
  font-family: var(--font-ui);
  padding: 0.45rem 0.8rem;
}

.transfer-list {
  display: grid;
  gap: 0.45rem;
}

.transfer-card {
  background: rgb(6 18 38 / 80%);
  border: 1px solid rgb(82 124 177 / 28%);
  border-radius: 10px;
  color: #c7e1fa;
  display: grid;
  font-family: var(--font-body);
  gap: 0.2rem;
  padding: 0.55rem;
}

.preview-image {
  border-radius: 10px;
  max-height: 150px;
  max-width: min(100%, 220px);
  object-fit: cover;
}

.transfer-header {
  align-items: center;
  display: flex;
  justify-content: space-between;
}

.transfer-header strong {
  color: #eff8ff;
  font-family: var(--font-ui);
}

.transfer-card.state-failed {
  border-color: rgb(230 107 107 / 64%);
}

.empty-state {
  color: #94b6dc;
  font-family: var(--font-body);
  margin: 0;
}

.hidden-input {
  display: none;
}

@media (max-width: 900px) {
  .stage-form {
    grid-template-columns: 1fr;
  }
}
</style>
