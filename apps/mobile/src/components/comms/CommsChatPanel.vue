<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";

import { useNavigationDrawer } from "../../composables/useNavigationDrawer";
import {
  useMessagingStore,
  type MessagingMessageRecord,
} from "../../stores/messagingStore";
import CommsChatComposer from "./chat/CommsChatComposer.vue";
import CommsChatMessageBubble from "./chat/CommsChatMessageBubble.vue";

interface ChatVisualMessage {
  id: string;
  author: "server" | "user";
  label: string;
  body: string[];
  time: string;
  avatarUrl?: string;
  deliveryState?: "queued" | "sent" | "failed";
}

const USER_AVATAR =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuB9ABDI0CKs5d8QRPbfZViZ_G-m6hxIAsTK7LM_g29RfIyQRXMVJeVOG14yxmcjYn2GIClfS-FJP2fpFhfBm2QaZ2IIQPw_Bzum7dVD_A1GFmqk6NG-dkoXftWzyrS_375DBENpnL_1jHnMrDFVHv9bUd58iLtKS5Ld4dAtArrxVpl1XVWVaW1IbEoBiEOhOfeQKRNKOmE18l61pSxxXL1yah56J7s8A8lBlYt8ldyf3AoIqywtmFAdN4JuQ168FxJPG7iVKQVwKw";

const FALLBACK_MESSAGES: ChatVisualMessage[] = [
  {
    id: "fallback-server-1",
    author: "server",
    label: "Central Server",
    body: [
      "System integrity verified.",
      "Quantum handshake",
      "complete. Secure",
      "connection established on",
      "channel 4-Alpha.",
    ],
    time: "14:22",
  },
  {
    id: "fallback-user-1",
    author: "user",
    label: "Operative 01",
    body: [
      "Copy that. Requesting live",
      "satellite uplink for Sector 7",
    ],
    time: "14:23",
    avatarUrl: USER_AVATAR,
    deliveryState: "sent",
  },
];

const AUTO_REPLY_LINES = [
  "Raven uplink stable.",
  "Signal is clean enough to",
  "transmit jokes at military",
  "grade encryption.",
];

const QUICK_ACTIONS: Record<"add" | "mic" | "image" | "location" | "emoji", string> = {
  add: "Attach encrypted relay package.",
  mic: "Open voice relay for Raven squad.",
  image: "Send tactical image overlay to the hub.",
  location: "Pin current location to Raven corridor.",
  emoji: "Drop a secured acknowledgement.",
};

const messaging = useMessagingStore();
const { toggleNavigationDrawer } = useNavigationDrawer();

const localThread = ref(
  FALLBACK_MESSAGES.map((message) => ({
    ...message,
    body: [...message.body],
  })),
);
const composerText = ref("");
const sendingFallbackReply = ref(false);

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

function mapStoreMessage(message: MessagingMessageRecord): ChatVisualMessage {
  return {
    id: message.localMessageId,
    author: message.direction === "outbound" ? "user" : "server",
    label: message.direction === "outbound" ? "Operative 01" : "Central Server",
    body: message.content
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean),
    time: formatTimestamp(message.issuedAt),
    avatarUrl: message.direction === "outbound" ? USER_AVATAR : undefined,
    deliveryState: message.deliveryState,
  };
}

const hasLiveThread = computed(() => messaging.activeMessages.length > 0);

const visibleMessages = computed<ChatVisualMessage[]>(() =>
  hasLiveThread.value
    ? messaging.activeMessages.map(mapStoreMessage)
    : localThread.value,
);

const timestampLabel = computed(() => {
  const first = visibleMessages.value[0];
  return `TODAY ${first?.time ?? "14:22"} UTC`;
});

const encryptionLabel = computed(() => "ENCRYPTED CONNECTION");

const sendInProgress = computed(() => messaging.busy || sendingFallbackReply.value);

watch(
  () => messaging.activeDraft,
  (draft) => {
    if (hasLiveThread.value) {
      composerText.value = draft;
    }
  },
);

onMounted(() => {
  messaging.wire().catch(() => undefined);
});

function appendLocalMessage(message: ChatVisualMessage) {
  localThread.value = [...localThread.value, message];
}

function nextTimeLabel(offsetMinutes = 0): string {
  const base = new Date();
  base.setMinutes(base.getMinutes() + offsetMinutes);
  return base.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function sendLocal(text: string) {
  const trimmed = text.trim();
  if (!trimmed) {
    return;
  }

  appendLocalMessage({
    id: `local-user-${Date.now()}`,
    author: "user",
    label: "Operative 01",
    body: trimmed.split(/\n+/),
    time: nextTimeLabel(),
    avatarUrl: USER_AVATAR,
    deliveryState: "sent",
  });
  composerText.value = "";
  sendingFallbackReply.value = true;
  window.setTimeout(() => {
    appendLocalMessage({
      id: `local-server-${Date.now()}`,
      author: "server",
      label: "Central Server",
      body: AUTO_REPLY_LINES,
      time: nextTimeLabel(1),
    });
    sendingFallbackReply.value = false;
  }, 700);
}

async function sendCurrentDraft() {
  const nextDraft = composerText.value.trim();
  if (!nextDraft) {
    return;
  }

  if (messaging.ready) {
    messaging.setDraft(nextDraft);
    try {
      await messaging.sendDraft();
      composerText.value = "";
      return;
    } catch {
      await sendLocal(nextDraft);
      return;
    }
  }

  await sendLocal(nextDraft);
}

function handleQuickAction(kind: "add" | "mic" | "image" | "location" | "emoji") {
  composerText.value = QUICK_ACTIONS[kind];
}
</script>

<template>
  <section class="chat-screen" data-testid="comms-chat-screen">
    <h2 class="sr-only">Comms Chat</h2>

    <header class="chat-screen__header">
      <div class="chat-screen__header-side">
        <button
          class="chat-screen__menu"
          type="button"
          aria-label="Open navigation"
          @click="toggleNavigationDrawer"
        >
          <span class="material-symbols-outlined">menu</span>
        </button>
      </div>

      <div class="chat-screen__header-copy">
        <h1 class="chat-screen__title">CHAT</h1>
        <div class="chat-screen__status-copy">
          <span class="chat-screen__status-dot" />
          <span>{{ encryptionLabel }}</span>
        </div>
      </div>

      <div class="chat-screen__header-side chat-screen__header-side--end">
        <div class="chat-screen__live-pill">
          <span class="chat-screen__live-dot" />
          <span>LIVE</span>
        </div>
      </div>
    </header>

    <main class="chat-screen__thread">
      <div class="chat-screen__timestamp">
        <span>{{ timestampLabel }}</span>
      </div>

      <CommsChatMessageBubble
        v-for="message in visibleMessages"
        :key="message.id"
        :message="message"
      />
    </main>

    <CommsChatComposer
      v-model="composerText"
      :sending="sendInProgress"
      @quick="handleQuickAction"
      @send="sendCurrentDraft"
    />
  </section>
</template>

<style scoped>
.sr-only {
  border: 0;
  clip: rect(0, 0, 0, 0);
  height: 1px;
  margin: -1px;
  overflow: hidden;
  padding: 0;
  position: absolute;
  white-space: nowrap;
  width: 1px;
}

.chat-screen {
  background:
    radial-gradient(circle at top center, rgb(18 71 83 / 22%), transparent 35%),
    linear-gradient(180deg, #021317, #03171b 52%, #04181c 100%);
  color: #f2fbff;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  height: 100%;
  margin: 0 auto;
  max-width: 24rem;
  overflow: hidden;
  position: relative;
}

.chat-screen::before,
.chat-screen::after {
  background: rgb(40 209 244 / 14%);
  bottom: 0;
  content: "";
  position: absolute;
  top: 0;
  width: 1px;
}

.chat-screen::before {
  left: 0;
}

.chat-screen::after {
  right: 0;
}

.chat-screen__header {
  align-items: center;
  border-bottom: 1px solid rgb(36 211 244 / 22%);
  display: grid;
  gap: 0.4rem;
  grid-template-columns: 4rem minmax(0, 1fr) 4rem;
  min-height: 6.35rem;
  padding: calc(env(safe-area-inset-top) + 0.9rem) 0.7rem 1rem;
}

.chat-screen__header-side {
  display: flex;
  justify-content: flex-start;
}

.chat-screen__header-side--end {
  justify-content: flex-end;
}

.chat-screen__menu {
  align-items: center;
  background: transparent;
  border: 0;
  color: #1ed7ff;
  display: inline-flex;
  height: 2.75rem;
  justify-content: center;
  width: 2.75rem;
}

.chat-screen__menu .material-symbols-outlined {
  font-size: 2rem;
}

.chat-screen__header-copy {
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.chat-screen__title {
  color: #18d8ff;
  font-family: var(--font-headline);
  font-size: 2rem;
  font-style: italic;
  font-weight: 700;
  letter-spacing: 0.02em;
  line-height: 1;
  margin: 0;
}

.chat-screen__status-copy {
  align-items: flex-start;
  color: #1ed7ff;
  display: inline-flex;
  font-family: var(--font-ui);
  font-size: 0.82rem;
  gap: 0.45rem;
  letter-spacing: 0.08em;
  line-height: 1.35;
  max-width: 8rem;
  opacity: 0.8;
  text-transform: uppercase;
}

.chat-screen__status-dot {
  background: #1ed7ff;
  border-radius: 999px;
  box-shadow: 0 0 14px rgb(30 215 255 / 70%);
  flex: none;
  height: 0.58rem;
  margin-top: 0.4rem;
  width: 0.58rem;
}

.chat-screen__live-pill {
  align-items: center;
  background: rgb(9 54 65 / 58%);
  border: 1px solid rgb(50 211 244 / 30%);
  border-radius: 999px;
  color: #1ed7ff;
  display: inline-flex;
  font-family: var(--font-ui);
  font-size: 0.72rem;
  font-weight: 700;
  gap: 0.4rem;
  letter-spacing: 0.05em;
  min-height: 2rem;
  padding: 0 0.7rem;
}

.chat-screen__live-dot {
  background: #1ed7ff;
  border-radius: 999px;
  box-shadow: 0 0 10px rgb(30 215 255 / 60%);
  height: 0.42rem;
  width: 0.42rem;
}

.chat-screen__thread {
  align-content: start;
  display: grid;
  gap: 1.8rem;
  min-height: 0;
  overflow-y: auto;
  padding: 1.6rem 0.8rem 1.2rem;
}

.chat-screen__thread::-webkit-scrollbar {
  display: none;
}

.chat-screen__timestamp {
  display: flex;
  justify-content: center;
}

.chat-screen__timestamp span {
  background: #142849;
  border: 1px solid rgb(54 97 156 / 54%);
  border-radius: 999px;
  color: #adc1df;
  font-family: var(--font-ui);
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  padding: 0.5rem 1.1rem;
  text-transform: uppercase;
}
</style>
