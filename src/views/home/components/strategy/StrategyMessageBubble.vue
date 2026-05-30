<template>
  <div class="message-row" :class="{ mine: isUser }">
    <div class="message-bubble">
      <p class="message-content">{{ message.content }}</p>
      <StrategyMessageCard
        v-if="hasCard"
        :metadata="message.metadata"
        :actions-disabled="actionsDisabled"
        @action="(action, payload) => emit('action', action, payload)"
      />
      <time>{{ timeText }}</time>
    </div>
  </div>
</template>

<script setup lang="ts">
import StrategyMessageCard from "./StrategyMessageCard.vue";
import type { AgentMessage } from "@/types/strategy";

const props = defineProps<{
  message: AgentMessage;
  actionsDisabled?: boolean;
}>();

const emit = defineEmits<{
  action: [action: string, payload?: Record<string, unknown>];
}>();

const isUser = computed(() => props.message.role === "USER");
const hasCard = computed(() => Boolean(props.message.metadata?.card));
const timeText = computed(() =>
  new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(props.message.createdAt)),
);
</script>

<style scoped lang="scss">
.message-row {
  display: flex;
  justify-content: flex-start;
  width: 100%;

  &.mine {
    justify-content: flex-end;
  }
}

.message-bubble {
  max-width: min(760px, 82%);
  padding: 12px 14px 10px;
}

.mine .message-bubble {
  color: #ffffff;
  background: #1267ff;
  border-color: #1267ff;
}

.message-content {
  margin: 0;
  white-space: pre-wrap;
  color: inherit;
  font-size: 14px;
  line-height: 1.75;
  word-break: break-word;
}

time {
  display: block;
  margin-top: 8px;
  color: #9aa5b5;
  font-size: 11px;
  text-align: right;
}

.mine time {
  color: #d9e8ff;
}
</style>
