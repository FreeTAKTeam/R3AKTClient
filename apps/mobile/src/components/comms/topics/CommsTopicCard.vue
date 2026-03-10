<script setup lang="ts">
defineProps<{
  topic: TopicCardViewModel;
}>();

const emit = defineEmits<{
  edit: [];
  delete: [];
}>();

export interface TopicCardViewModel {
  topicId: string;
  topicName: string;
  topicDescription: string;
  subscriberLabel: string;
  state: "active" | "idle";
  branch: string;
}
</script>

<template>
  <article class="topic-card">
    <div class="topic-card__id">ID: {{ topic.topicId }}</div>

    <div class="topic-card__header">
      <div>
        <h3>{{ topic.topicName }}</h3>
        <div class="topic-card__meta">
          <span class="material-symbols-outlined">groups</span>
          <span>{{ topic.subscriberLabel }}</span>
        </div>
      </div>

      <div class="topic-card__state" :class="topic.state">
        {{ topic.state }}
      </div>
    </div>

    <p class="topic-card__description">{{ topic.topicDescription }}</p>

    <div class="topic-card__actions">
      <button class="topic-card__action topic-card__action--edit" type="button" @click="emit('edit')">
        <span class="material-symbols-outlined">edit</span>
        <span>Edit</span>
      </button>
      <button class="topic-card__action topic-card__action--delete" type="button" @click="emit('delete')">
        <span class="material-symbols-outlined">delete</span>
        <span>Delete</span>
      </button>
    </div>
  </article>
</template>

<style scoped>
.topic-card {
  background: rgb(37 209 244 / 5%);
  border: 1px solid rgb(37 209 244 / 10%);
  border-radius: 1rem;
  overflow: hidden;
  padding: 1rem;
  position: relative;
}

.topic-card__id {
  color: rgb(37 209 244 / 30%);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.52rem;
  letter-spacing: 0.08em;
  position: absolute;
  right: 0.6rem;
  text-transform: uppercase;
  top: 0.4rem;
}

.topic-card__header {
  align-items: start;
  display: flex;
  justify-content: space-between;
  gap: 0.8rem;
  margin-bottom: 0.8rem;
}

.topic-card__header h3 {
  color: #25d1f4;
  font-family: var(--font-ui);
  font-size: 1.15rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  margin: 0;
}

.topic-card__meta {
  align-items: center;
  color: #97a8b2;
  display: inline-flex;
  gap: 0.22rem;
  margin-top: 0.25rem;
}

.topic-card__meta .material-symbols-outlined {
  color: rgb(37 209 244 / 60%);
  font-size: 0.92rem;
}

.topic-card__meta span:last-child {
  font-family: var(--font-body);
  font-size: 0.78rem;
}

.topic-card__state {
  border-radius: 999px;
  font-family: var(--font-ui);
  font-size: 0.6rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  min-width: 3.4rem;
  padding: 0.35rem 0.55rem;
  text-align: center;
  text-transform: uppercase;
}

.topic-card__state.active {
  background: rgb(37 209 244 / 20%);
  color: #25d1f4;
}

.topic-card__state.idle {
  background: rgb(37 209 244 / 10%);
  color: rgb(37 209 244 / 40%);
}

.topic-card__description {
  color: #9eb0ba;
  font-family: var(--font-body);
  font-size: 0.9rem;
  line-height: 1.55;
  margin: 0 0 1rem;
}

.topic-card__actions {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.topic-card__action {
  align-items: center;
  border-radius: 0.8rem;
  display: inline-flex;
  gap: 0.45rem;
  justify-content: center;
  min-height: 2.75rem;
}

.topic-card__action span:last-child {
  font-family: var(--font-ui);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.topic-card__action .material-symbols-outlined {
  font-size: 1rem;
}

.topic-card__action--edit {
  background: rgb(37 209 244 / 10%);
  border: 1px solid rgb(37 209 244 / 30%);
  color: #25d1f4;
}

.topic-card__action--delete {
  background: transparent;
  border: 1px solid rgb(239 68 68 / 30%);
  color: #f87171;
}
</style>
