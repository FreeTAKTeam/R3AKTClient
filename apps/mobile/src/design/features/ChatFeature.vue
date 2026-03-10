<script setup lang="ts">
import { useDesignChatData } from "../composables/useDesignChatData";
import PrototypeLivePill from "../components/prototype/PrototypeLivePill.vue";
import PrototypeScreenFrame from "../components/prototype/PrototypeScreenFrame.vue";

const {
  draftMessage,
  liveLabel,
  messages,
  sendCurrentDraft,
  sendQuickMessage,
  sending,
  timestampLabel,
} = useDesignChatData();
</script>

<template>
  <PrototypeScreenFrame root-class="antialiased">
    <div class="relative mx-auto flex h-screen max-w-md flex-col overflow-hidden border-x border-slate-800 shadow-2xl">
      <header
        class="sticky top-0 z-10 flex items-center justify-between border-b border-primary/20 bg-background-dark/80 p-4 backdrop-blur-md"
      >
        <div class="flex w-1/4 items-center">
          <button class="rounded-lg p-2 text-primary transition-colors hover:bg-primary/10">
            <span class="material-symbols-outlined text-2xl">menu</span>
          </button>
        </div>
        <div class="flex flex-1 flex-col items-center">
          <h1 class="text-lg font-bold uppercase italic leading-tight tracking-tight text-primary">CHAT</h1>
          <div class="flex items-center gap-1.5">
            <span class="size-2 rounded-full bg-primary shadow-[0_0_8px_rgba(37,209,244,0.6)] animate-pulse" />
            <span class="text-[10px] font-medium uppercase tracking-widest text-primary/70">
              {{ liveLabel }}
            </span>
          </div>
        </div>
        <div class="flex w-1/4 items-center justify-end">
          <PrototypeLivePill dot label="LIVE" tone="primary" class="px-2 py-1" />
        </div>
      </header>

      <main class="scrollbar-hide flex-1 space-y-6 overflow-y-auto p-4">
        <div class="my-4 flex justify-center">
          <span class="rounded-full border border-slate-700/50 bg-slate-800/50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
            {{ timestampLabel }}
          </span>
        </div>

        <div
          v-for="message in messages"
          :key="message.id"
          class="group flex items-start gap-3"
          :class="message.author === 'user' ? 'justify-end' : ''"
        >
          <template v-if="message.author === 'server'">
            <div class="relative">
              <div class="flex size-10 items-center justify-center overflow-hidden rounded-lg border border-primary/30 bg-slate-800 shadow-[0_0_15px_rgba(37,209,244,0.1)]">
                <img class="h-full w-full object-cover opacity-80" :alt="message.label" :src="message.avatar" />
              </div>
              <div class="absolute -bottom-1 -right-1 size-3 rounded-full border-2 border-background-dark bg-primary" />
            </div>
            <div class="flex max-w-[80%] flex-col gap-1.5">
              <p class="ml-1 text-[11px] font-bold uppercase tracking-widest text-primary/70">{{ message.label }}</p>
              <div class="rounded-bl-xl rounded-br-xl rounded-tr-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-slate-200 shadow-lg">
                <p
                  v-for="(line, lineIndex) in message.body"
                  :key="`${message.id}-${lineIndex}`"
                  class="text-sm leading-relaxed"
                  :class="lineIndex === 0 && message.body.length > 1 ? 'mb-2 italic' : ''"
                >
                  {{ line }}
                </p>
              </div>
              <span class="ml-1 text-[10px] font-medium text-slate-500">{{ message.time }}</span>
            </div>
          </template>

          <template v-else>
            <div class="flex max-w-[80%] flex-col items-end gap-1.5">
              <p class="mr-1 text-[11px] font-bold uppercase tracking-widest text-primary">{{ message.label }}</p>
              <div class="rounded-bl-xl rounded-br-xl rounded-tl-xl bg-primary px-4 py-3 font-medium text-background-dark shadow-[0_0_20px_rgba(37,209,244,0.2)]">
                <p class="text-sm leading-relaxed" v-for="(line, lineIndex) in message.body" :key="`${message.id}-${lineIndex}`">
                  {{ line }}
                </p>
              </div>
              <div class="mr-1 flex items-center gap-1">
                <span class="text-[10px] font-medium text-slate-500">{{ message.time }}</span>
                <span class="material-symbols-outlined text-sm text-primary">
                  {{ message.deliveryState === "failed" ? "error" : "done_all" }}
                </span>
              </div>
            </div>
            <div class="flex size-10 items-center justify-center overflow-hidden rounded-lg border border-primary/50 bg-slate-800 shadow-[0_0_15px_rgba(37,209,244,0.2)]">
              <img class="h-full w-full object-cover" :alt="message.label" :src="message.avatar" />
            </div>
          </template>
        </div>

        <article
          v-if="messages.length === 0"
          class="rounded-xl border border-dashed border-primary/30 bg-slate-800/40 p-6 text-center text-sm text-slate-400"
        >
          No chat traffic in the active conversation yet.
        </article>
      </main>

      <footer class="space-y-4 border-t border-slate-800 bg-background-dark p-4">
        <div class="flex items-center gap-3">
          <button
            class="flex items-center justify-center rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-primary transition-all active:scale-95 hover:bg-slate-700"
            @click="sendQuickMessage('Attachment request staged for transmission.')"
          >
            <span class="material-symbols-outlined">add</span>
          </button>
          <div class="relative flex flex-1 items-center">
            <input
              v-model="draftMessage"
              class="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 transition-all focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="Encrypted message..."
              type="text"
              @keydown.enter="sendCurrentDraft()"
            />
            <button class="absolute right-2 p-1 text-slate-500 hover:text-primary" @click="sendQuickMessage('Facial authentication requested.')">
              <span class="material-symbols-outlined text-xl">face</span>
            </button>
          </div>
          <button
            class="flex items-center justify-center rounded-lg bg-primary p-2.5 text-background-dark shadow-[0_0_15px_rgba(37,209,244,0.3)] transition-all active:scale-95 hover:brightness-110"
            :disabled="sending"
            @click="sendCurrentDraft()"
          >
            <span class="material-symbols-outlined font-bold">send</span>
          </button>
        </div>

        <div class="flex items-center justify-between px-2">
          <div class="flex gap-4">
            <button class="text-slate-500 transition-colors hover:text-primary" @click="sendQuickMessage('Voice channel test initiated.')">
              <span class="material-symbols-outlined text-lg">mic</span>
            </button>
            <button class="text-slate-500 transition-colors hover:text-primary" @click="sendQuickMessage('Image relay staged for upload.')">
              <span class="material-symbols-outlined text-lg">image</span>
            </button>
            <button class="text-slate-500 transition-colors hover:text-primary" @click="sendQuickMessage('Location beacon attached to next packet.')">
              <span class="material-symbols-outlined text-lg">location_on</span>
            </button>
          </div>
          <div class="flex items-center gap-1 text-[10px] font-bold uppercase tracking-tighter text-slate-600">
            <span class="material-symbols-outlined text-xs">lock</span>
            End-to-end
          </div>
        </div>
      </footer>
    </div>
  </PrototypeScreenFrame>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
