<script setup lang="ts">
import type { AttachmentDirection } from "@reticulum/node-client";
import { ref } from "vue";

import { useFilesMediaStore } from "../../stores/filesMediaStore";
import { useMessagingStore } from "../../stores/messagingStore";

const filesStore = useFilesMediaStore();
const messagingStore = useMessagingStore();

const fileName = ref("");
const fileMimeType = ref("application/octet-stream");
const fileSize = ref<number>(0);
const direction = ref<AttachmentDirection>("upload");

function stageTransfer(): void {
  const trimmedName = fileName.value.trim();
  if (!trimmedName) {
    return;
  }

  const transferId = filesStore.beginTransfer({
    channelKey: messagingStore.activeChannelKey,
    name: trimmedName,
    mimeType: fileMimeType.value.trim() || undefined,
    sizeBytes: Number(fileSize.value) || undefined,
    direction: direction.value,
  });

  filesStore.updateTransferState(transferId, {
    state: "in_progress",
    progressPct: 40,
  });
  window.setTimeout(() => {
    filesStore.updateTransferState(transferId, {
      state: "completed",
      progressPct: 100,
    });
  }, 500);

  fileName.value = "";
  fileSize.value = 0;
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
        Name
        <input v-model="fileName" class="text-input" type="text" placeholder="file name" />
      </label>
      <label class="input-label">
        MIME type
        <input v-model="fileMimeType" class="text-input" type="text" />
      </label>
      <label class="input-label">
        Size (bytes)
        <input v-model.number="fileSize" class="text-input" type="number" min="0" />
      </label>
      <label class="input-label">
        Direction
        <select v-model="direction" class="text-input">
          <option value="upload">upload</option>
          <option value="download">download</option>
        </select>
      </label>
      <button class="stage-button" type="button" @click="stageTransfer">Stage Transfer</button>
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
        <p>
          {{ transfer.mimeType || "unknown mime" }} · {{ transfer.sizeBytes ?? 0 }} bytes
        </p>
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
  grid-template-columns: repeat(5, minmax(0, 1fr));
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

@media (max-width: 900px) {
  .stage-form {
    grid-template-columns: 1fr;
  }
}
</style>
