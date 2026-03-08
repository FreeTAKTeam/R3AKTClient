<script setup lang="ts">
const model = defineModel<string>({ required: true });

defineProps<{
  sending: boolean;
}>();

const emit = defineEmits<{
  send: [];
  quick: [kind: "add" | "mic" | "image" | "location" | "emoji"];
}>();

function emitSend() {
  emit("send");
}
</script>

<template>
  <footer class="chat-composer">
    <div class="composer-main">
      <button class="composer-button composer-button--utility" type="button" @click="emit('quick', 'add')">
        <span class="material-symbols-outlined">add</span>
      </button>

      <label class="composer-input-shell">
        <input
          v-model="model"
          class="composer-input"
          placeholder="Encrypted message"
          type="text"
          @keydown.enter="emitSend"
        />
        <button class="composer-emoji" type="button" @click="emit('quick', 'emoji')">
          <span class="material-symbols-outlined">sentiment_satisfied</span>
        </button>
      </label>

      <button
        class="composer-button composer-button--send"
        type="button"
        :disabled="sending"
        @click="emitSend"
      >
        <span class="material-symbols-outlined">send</span>
      </button>
    </div>

    <div class="composer-quick-row">
      <div class="composer-quick-actions">
        <button class="quick-icon" type="button" @click="emit('quick', 'mic')">
          <span class="material-symbols-outlined">mic</span>
        </button>
        <button class="quick-icon" type="button" @click="emit('quick', 'image')">
          <span class="material-symbols-outlined">image</span>
        </button>
        <button class="quick-icon" type="button" @click="emit('quick', 'location')">
          <span class="material-symbols-outlined">location_on</span>
        </button>
      </div>

      <div class="composer-security">
        <span class="material-symbols-outlined">lock</span>
        <span>End-to-end</span>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.chat-composer {
  background: linear-gradient(180deg, rgb(5 24 30 / 94%), rgb(4 17 23 / 98%) 100%);
  border-top: 1px solid rgb(48 211 244 / 18%);
  display: grid;
  gap: 0.9rem;
  padding: 1rem 0.9rem calc(0.95rem + env(safe-area-inset-bottom));
}

.composer-main {
  align-items: center;
  display: grid;
  gap: 0.85rem;
  grid-template-columns: auto minmax(0, 1fr) auto;
}

.composer-button {
  align-items: center;
  border-radius: 0.85rem;
  display: inline-flex;
  height: 2.8rem;
  justify-content: center;
  width: 2.8rem;
}

.composer-button--utility {
  background: #182848;
  border: 1px solid rgb(65 105 167 / 48%);
  color: #2ad8ff;
}

.composer-button--send {
  background: linear-gradient(180deg, #2dd3f4, #26badb 100%);
  border: 1px solid rgb(118 238 255 / 26%);
  box-shadow: 0 0 18px rgb(37 209 244 / 22%);
  color: #072028;
}

.composer-button--send:disabled {
  filter: saturate(0.5);
  opacity: 0.72;
}

.composer-input-shell {
  align-items: center;
  background: #071a2f;
  border: 1px solid rgb(57 101 165 / 42%);
  border-radius: 0.9rem;
  display: grid;
  gap: 0.25rem;
  grid-template-columns: minmax(0, 1fr) auto;
  min-height: 2.8rem;
  padding: 0 0.45rem 0 0.9rem;
}

.composer-input {
  appearance: none;
  background: transparent;
  border: 0;
  color: #d7ecff;
  font-family: var(--font-body);
  font-size: 0.98rem;
  min-width: 0;
  outline: none;
}

.composer-input::placeholder {
  color: #5f79a0;
}

.composer-emoji {
  align-items: center;
  background: transparent;
  border: 0;
  color: #5f79a0;
  display: inline-flex;
  height: 2rem;
  justify-content: center;
  width: 2rem;
}

.composer-quick-row {
  align-items: center;
  display: flex;
  justify-content: space-between;
  padding: 0 0.2rem;
}

.composer-quick-actions {
  display: flex;
  gap: 1rem;
}

.quick-icon {
  align-items: center;
  background: transparent;
  border: 0;
  color: #6d8792;
  display: inline-flex;
  justify-content: center;
  padding: 0;
}

.composer-security {
  align-items: center;
  color: #5d7078;
  display: inline-flex;
  font-family: var(--font-ui);
  font-size: 0.64rem;
  font-weight: 700;
  gap: 0.18rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.composer-security .material-symbols-outlined {
  font-size: 0.82rem;
}
</style>
