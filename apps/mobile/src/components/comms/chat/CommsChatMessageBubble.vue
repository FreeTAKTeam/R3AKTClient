<script setup lang="ts">
interface ChatVisualMessage {
  id: string;
  author: "server" | "user";
  label: string;
  body: string[];
  time: string;
  avatarUrl?: string;
  deliveryState?: "queued" | "sent" | "failed";
}

defineProps<{
  message: ChatVisualMessage;
}>();
</script>

<template>
  <article
    class="chat-row"
    :class="message.author === 'user' ? 'justify-end' : 'justify-start'"
  >
    <template v-if="message.author === 'server'">
      <div class="server-badge" aria-hidden="true">
        <div class="server-badge__frame">
          <span class="material-symbols-outlined server-badge__glyph">sensors</span>
        </div>
        <span class="server-badge__status" />
      </div>

      <div class="message-stack message-stack--server">
        <p class="message-label message-label--server">{{ message.label }}</p>
        <div class="message-bubble message-bubble--server">
          <p
            v-for="(line, index) in message.body"
            :key="`${message.id}-${index}`"
            class="message-line"
          >
            {{ line }}
          </p>
        </div>
        <span class="message-time">{{ message.time }}</span>
      </div>
    </template>

    <template v-else>
      <div class="message-stack message-stack--user">
        <p class="message-label message-label--user">{{ message.label }}</p>
        <div class="message-bubble message-bubble--user">
          <p
            v-for="(line, index) in message.body"
            :key="`${message.id}-${index}`"
            class="message-line"
          >
            {{ line }}
          </p>
        </div>
        <div class="message-meta">
          <span class="message-time">{{ message.time }}</span>
          <span class="material-symbols-outlined message-status">
            {{ message.deliveryState === "failed" ? "error" : "done_all" }}
          </span>
        </div>
      </div>

      <div class="user-avatar">
        <img
          v-if="message.avatarUrl"
          :src="message.avatarUrl"
          :alt="message.label"
        />
      </div>
    </template>
  </article>
</template>

<style scoped>
.chat-row {
  align-items: flex-start;
  display: flex;
  gap: 1.05rem;
}

.server-badge {
  flex: none;
  margin-top: 0.2rem;
  position: relative;
}

.server-badge__frame {
  align-items: center;
  background: linear-gradient(180deg, #d4dfe7, #bfcbd4);
  border: 1px solid rgb(111 142 166 / 38%);
  border-radius: 0.95rem;
  box-shadow: 0 8px 18px rgb(0 0 0 / 18%);
  color: #00c5f8;
  display: inline-flex;
  height: 3.2rem;
  justify-content: center;
  width: 3.2rem;
}

.server-badge__glyph {
  font-size: 1.45rem;
  font-variation-settings: "FILL" 0, "wght" 500, "GRAD" 0, "opsz" 24;
}

.server-badge__status {
  background: #1ed7ff;
  border: 2px solid #082028;
  border-radius: 999px;
  bottom: -0.15rem;
  height: 0.78rem;
  position: absolute;
  right: -0.18rem;
  width: 0.78rem;
}

.message-stack {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.message-stack--server {
  max-width: min(16.6rem, calc(100vw - 7rem));
}

.message-stack--user {
  align-items: flex-end;
  max-width: min(15rem, calc(100vw - 7rem));
}

.message-label {
  font-family: var(--font-ui);
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  margin: 0;
  text-transform: uppercase;
}

.message-label--server {
  color: #1ed7ff;
  padding-left: 0.18rem;
}

.message-label--user {
  color: #1ed7ff;
  padding-right: 0.18rem;
}

.message-bubble {
  border-radius: 1rem;
  padding: 0.92rem 1.1rem 0.98rem;
}

.message-bubble--server {
  background: linear-gradient(180deg, #1a2a45, #1b2b47 100%);
  border: 1px solid rgb(78 121 181 / 58%);
  border-bottom-left-radius: 0.45rem;
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 2%);
}

.message-bubble--user {
  background: linear-gradient(180deg, #31ccea, #2fbedf 100%);
  border: 1px solid rgb(92 223 255 / 30%);
  border-top-right-radius: 0.35rem;
  color: #03151a;
}

.message-line {
  font-family: var(--font-body);
  font-size: 0.98rem;
  line-height: 1.72;
  margin: 0;
}

.message-time {
  color: #5f7f9d;
  font-family: var(--font-body);
  font-size: 0.74rem;
}

.message-meta {
  align-items: center;
  display: flex;
  gap: 0.28rem;
}

.message-status {
  color: #1ed7ff;
  font-size: 0.94rem;
}

.user-avatar {
  background: linear-gradient(180deg, #0f2632, #091820 100%);
  border: 1px solid rgb(48 211 244 / 42%);
  border-radius: 0.95rem;
  box-shadow: 0 0 18px rgb(37 209 244 / 16%);
  flex: none;
  height: 3.2rem;
  margin-top: 1.95rem;
  overflow: hidden;
  width: 3.2rem;
}

.user-avatar img {
  display: block;
  height: 100%;
  object-fit: cover;
  width: 100%;
}
</style>
