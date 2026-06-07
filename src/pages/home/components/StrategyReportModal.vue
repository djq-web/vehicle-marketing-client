<template>
  <view
    v-if="isRendered"
    class="report-modal-mask"
    :class="{ closing: isClosing }"
    @click="requestClose"
  >
    <view class="report-modal-panel" @click.stop>
      <view class="report-modal-header">
        <view class="report-modal-heading">
          <text class="report-modal-kicker">报告查看</text>
          <text class="report-modal-title">{{ modalTitle }}</text>
        </view>
        <view class="report-modal-tools">
          <button
            v-if="canExportPdf"
            class="report-modal-export"
            :disabled="actionsDisabled || loading"
            @click="emit('action', 'export_report_pdf')"
          >
            导出 PDF
          </button>
          <button class="report-modal-close" @click="requestClose">
            <view class="report-close-icon">
              <text></text>
              <text></text>
            </view>
          </button>
        </view>
      </view>

      <scroll-view class="report-modal-body" scroll-y>
        <view v-if="loading" class="report-loading">
          <view class="loading-dot"></view>
          <text>正在打开报告</text>
        </view>
        <StrategyReportDetailCard
          v-else-if="report"
          :report="report"
          :next-actions="nextActions"
          :actions-disabled="actionsDisabled"
          @action="(action) => emit('action', action)"
        />
        <view v-else class="report-empty">
          <text>暂无报告内容</text>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import StrategyReportDetailCard from "./StrategyReportDetailCard.vue";

const props = defineProps<{
  visible: boolean;
  loading?: boolean;
  report?: Record<string, unknown> | null;
  nextActions?: string[];
  actionsDisabled?: boolean;
}>();

const emit = defineEmits<{
  close: [];
  action: [action: string];
}>();

const isRendered = ref(false);
const isClosing = ref(false);
let closeTimer: ReturnType<typeof setTimeout> | null = null;

const modalTitle = computed(() => {
  const title = props.report?.title;
  return typeof title === "string" && title.trim() ? title.trim() : "战略报告";
});
const canExportPdf = computed(() => {
  const report = props.report ?? {};
  const status = typeof report.status === "string" ? report.status : "";
  const content = typeof report.content === "string" ? report.content.trim() : "";

  return (
    content.length > 0 &&
    (report.isGenerated === true || status.toLowerCase() === "generated")
  );
});

watch(
  () => props.visible,
  (visible) => {
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }

    if (visible) {
      isRendered.value = true;
      isClosing.value = false;
      return;
    }

    if (!isRendered.value) {
      return;
    }

    isClosing.value = true;
    closeTimer = setTimeout(() => {
      isRendered.value = false;
      isClosing.value = false;
      closeTimer = null;
    }, 190);
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  if (closeTimer) {
    clearTimeout(closeTimer);
  }
});

function requestClose() {
  if (!props.loading) {
    emit("close");
  }
}
</script>

<style scoped>
.report-modal-mask {
  position: fixed;
  inset: 0;
  z-index: 2300;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  padding: 36px;
  background: rgb(17 24 39 / 34%);
  animation: report-fade-in 0.18s ease forwards;
}

.report-modal-mask.closing {
  animation: report-fade-out 0.16s ease forwards;
}

.report-modal-panel {
  display: flex;
  width: min(860px, 100%);
  max-height: min(760px, 86vh);
  flex-direction: column;
  overflow: hidden;
  background: #ffffff;
  border-radius: 22px;
  box-shadow: 0 28px 70px rgb(15 23 42 / 26%);
  animation: report-pop-in 0.22s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
}

.report-modal-mask.closing .report-modal-panel {
  animation: report-pop-out 0.16s ease forwards;
}

.report-modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  padding: 24px 28px 18px;
  border-bottom: 1px solid #e7ecf4;
}

.report-modal-heading {
  min-width: 0;
  flex: 1;
}

.report-modal-kicker {
  display: block;
  color: #8b95a7;
  font-size: 12px;
  line-height: 1.3;
}

.report-modal-title {
  display: block;
  margin-top: 4px;
  overflow: hidden;
  color: #111827;
  font-size: 20px;
  font-weight: 800;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.report-modal-tools {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 18px;
}

.report-modal-export {
  display: inline-flex;
  width: auto;
  min-width: 88px;
  min-height: 34px;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0 14px;
  color: #1267ff;
  font-size: 13px;
  font-weight: 800;
  line-height: 32px;
  background: #edf5ff;
  border: 1px solid #cfe0f7;
  border-radius: 999px;
  box-shadow: none;
}

.report-modal-export::after {
  border: 0;
}

.report-modal-export[disabled] {
  opacity: 0.55;
}

.report-modal-close {
  position: relative;
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  margin: 0;
  padding: 0;
  background: #f3f4f6;
  border: 0;
  border-radius: 50%;
  box-shadow: none;
}

.report-modal-close::after {
  border: 0;
}

.report-close-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 18px;
  height: 18px;
  transform: translate(-50%, -50%);
}

.report-close-icon text {
  position: absolute;
  top: 8px;
  left: 1px;
  width: 16px;
  height: 2px;
  background: #4b5563;
  border-radius: 999px;
}

.report-close-icon text:first-child {
  transform: rotate(45deg);
}

.report-close-icon text:last-child {
  transform: rotate(-45deg);
}

.report-modal-body {
  box-sizing: border-box;
  max-height: calc(86vh - 92px);
  padding: 20px 28px 28px;
}

.report-loading,
.report-empty {
  display: flex;
  min-height: 260px;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #64748b;
  font-size: 14px;
}

.loading-dot {
  width: 10px;
  height: 10px;
  background: #1267ff;
  border-radius: 50%;
  animation: loading-pulse 1s ease-in-out infinite;
}

.report-modal-body :deep(.report-detail-card) {
  margin-top: 0;
  padding: 0;
  background: transparent;
  border: 0;
  border-radius: 0;
}

.report-modal-body :deep(.report-content) {
  max-height: none;
  overflow: visible;
}

@keyframes report-fade-in {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes report-fade-out {
  from {
    opacity: 1;
  }

  to {
    opacity: 0;
  }
}

@keyframes report-pop-in {
  from {
    opacity: 0;
    transform: translateY(18px) scale(0.98);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes report-pop-out {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }

  to {
    opacity: 0;
    transform: translateY(12px) scale(0.985);
  }
}

@keyframes loading-pulse {
  0%,
  100% {
    opacity: 0.35;
    transform: scale(0.9);
  }

  50% {
    opacity: 1;
    transform: scale(1.25);
  }
}

@media (max-width: 760px) {
  .report-modal-mask {
    align-items: flex-end;
    padding: 0;
    background: rgb(17 24 39 / 30%);
  }

  .report-modal-panel {
    width: 100%;
    max-height: 88vh;
    border-radius: 44rpx 44rpx 0 0;
    animation-name: report-slide-up;
  }

  .report-modal-mask.closing .report-modal-panel {
    animation-name: report-slide-down;
  }

  .report-modal-header {
    padding: 36rpx 40rpx 28rpx;
  }

  .report-modal-kicker {
    font-size: 22rpx;
  }

  .report-modal-title {
    max-width: calc(100vw - 282rpx);
    font-size: 34rpx;
  }

  .report-modal-tools {
    gap: 28rpx;
  }

  .report-modal-export {
    min-width: 150rpx;
    min-height: 62rpx;
    padding: 0 24rpx;
    font-size: 24rpx;
    line-height: 58rpx;
  }

  .report-modal-close {
    width: 64rpx;
    height: 64rpx;
    flex-basis: 64rpx;
  }

  .report-close-icon {
    width: 34rpx;
    height: 34rpx;
  }

  .report-close-icon text {
    top: 15rpx;
    left: 2rpx;
    width: 30rpx;
    height: 4rpx;
  }

  .report-modal-body {
    max-height: calc(88vh - 126rpx);
    padding: 30rpx 36rpx 46rpx;
  }

  .report-loading,
  .report-empty {
    min-height: 360rpx;
    font-size: 28rpx;
  }

  @keyframes report-slide-up {
    from {
      opacity: 0;
      transform: translateY(42rpx);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes report-slide-down {
    from {
      opacity: 1;
      transform: translateY(0);
    }

    to {
      opacity: 0;
      transform: translateY(42rpx);
    }
  }
}
</style>
