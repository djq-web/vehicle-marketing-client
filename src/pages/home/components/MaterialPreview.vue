<template>
  <view class="material-preview" :class="previewClass">
    <template v-if="isDocument">
      <view class="file-info">
        <view class="file-mark">
          <text>{{ fileExtensionLabel }}</text>
        </view>
        <view class="file-copy">
          <text class="file-name">{{ name }}</text>
          <text class="file-meta">{{ fileMetaText }}</text>
        </view>
      </view>
    </template>

    <template v-else-if="isImage">
      <button class="image-button" :disabled="loading" @click="openZoom">
        <image
          v-if="objectUrl"
          class="preview-image"
          :src="objectUrl"
          mode="aspectFill"
          @error="handlePreviewMediaError"
        />
        <view v-else class="preview-placeholder">
          <text>{{ loading ? "读取中" : "图片预览" }}</text>
        </view>
      </button>
    </template>

    <template v-else-if="isVideo">
      <view
        v-if="compact"
        class="media-button video-cover"
        @click="openZoom"
      >
        <video
          v-if="objectUrl"
          class="preview-video media-poster"
          :src="objectUrl"
          :controls="false"
          muted
          playsinline
          preload="metadata"
          @loadedmetadata="handleVideoMetadata"
          @error="handlePreviewMediaError"
        ></video>
        <view v-else class="preview-placeholder">
          <text>{{ loading ? "读取中" : "视频预览" }}</text>
        </view>
        <view class="media-badge">
          <text>视频</text>
        </view>
      </view>
      <video
        v-else-if="objectUrl"
        class="preview-video"
        :src="objectUrl"
        controls
        @error="handlePreviewMediaError"
      ></video>
      <view v-else class="preview-placeholder">
        <text>{{ loading ? "读取中" : "视频预览" }}</text>
      </view>
    </template>

    <template v-else-if="isAudio">
      <view v-if="compact" class="media-button audio-cover" @click="openZoom">
        <view class="audio-cover-mark">
          <text>音频</text>
        </view>
        <text class="audio-cover-name">{{ name }}</text>
        <text class="audio-cover-meta">{{ loading ? "读取中" : "点击预览" }}</text>
      </view>
      <view v-else class="audio-preview">
        <text class="audio-title">{{ name }}</text>
        <!-- #ifdef H5 -->
        <component
          :is="'audio'"
          v-if="objectUrl"
          class="preview-audio"
          :src="objectUrl"
          controls
          @error="handlePreviewMediaError"
        />
        <!-- #endif -->
        <!-- #ifndef H5 -->
        <audio
          v-if="objectUrl"
          class="preview-audio"
          :src="objectUrl"
          controls
          @error="handlePreviewMediaError"
        ></audio>
        <!-- #endif -->
        <text v-else class="audio-status">{{
          loading ? "正在读取音频" : "音频预览"
        }}</text>
      </view>
    </template>

    <template v-else>
      <view class="file-info">
        <view class="file-mark fallback">
          <text>FILE</text>
        </view>
        <view class="file-copy">
          <text class="file-name">{{ name }}</text>
          <text class="file-meta">{{ fileMetaText || "暂不支持预览" }}</text>
        </view>
      </view>
    </template>

    <button v-if="error" class="preview-error" @click="loadPreview">
      {{ error }}
    </button>

    <view v-if="zoomVisible" class="zoom-mask" @click="closeZoom">
      <view class="zoom-panel" :class="{ media: isVideo || isAudio }" @click.stop>
        <view class="zoom-header">
          <text class="zoom-title">{{ name }}</text>
          <button class="zoom-close" @click="closeZoom">×</button>
        </view>
        <view class="zoom-body">
          <image
            v-if="isImage && objectUrl"
            class="zoom-image"
            :src="objectUrl"
            mode="aspectFit"
          />
          <video
            v-else-if="isVideo && objectUrl"
            ref="zoomVideoRef"
            class="zoom-video"
            :src="objectUrl"
            autoplay
            controls
            playsinline
            @error="handlePreviewMediaError"
          ></video>
          <view v-else-if="isAudio && objectUrl" class="zoom-audio-wrap">
            <view class="audio-cover-mark large">
              <text>音频</text>
            </view>
            <text class="zoom-audio-name">{{ name }}</text>
            <!-- #ifdef H5 -->
            <component
              :is="'audio'"
              class="zoom-audio"
              :src="objectUrl"
              controls
              @error="handlePreviewMediaError"
            />
            <!-- #endif -->
            <!-- #ifndef H5 -->
            <audio
              class="zoom-audio"
              :src="objectUrl"
              controls
              @error="handlePreviewMediaError"
            ></audio>
            <!-- #endif -->
          </view>
          <view v-else class="zoom-loading">
            <text>{{ loading ? "正在读取预览" : "暂无可预览内容" }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { fetchBlob, getUserErrorMessage, request } from "@/services/api";
import type { MaterialPreview as MaterialPreviewDescriptor } from "@/types/material";

const props = defineProps<{
  id: string;
  kind: "draft" | "asset";
  name: string;
  materialType?: string | null;
  fileExtension?: string | null;
  mimeType?: string | null;
  sizeReadable?: string | null;
  previewUrl?: string | null;
  preview?: MaterialPreviewDescriptor | null;
  compact?: boolean;
}>();

type MaterialPreviewUrlResponse = MaterialPreviewDescriptor & {
  mode?: "proxy" | "signed_url" | string;
  url?: string | null;
};

const objectUrl = ref("");
const loading = ref(false);
const error = ref("");
const zoomVisible = ref(false);
const zoomVideoRef = ref<HTMLVideoElement | null>(null);
const signedUrlRetryCount = ref(0);

const normalizedType = computed(() => (props.materialType || "").toLowerCase());
const normalizedMime = computed(() => (props.mimeType || "").toLowerCase());
const normalizedExtension = computed(() =>
  (props.fileExtension || "").replace(/^\./, "").toLowerCase(),
);
const previewEndpoint = computed(() =>
  normalizeApiEndpoint(props.preview?.endpoint) ||
  (props.kind === "draft"
    ? `/material/drafts/${encodeURIComponent(props.id)}/preview`
    : `/material/assets/${encodeURIComponent(props.id)}/preview`),
);
const signedPreviewEndpoint = computed(() =>
  normalizeApiEndpoint(props.preview?.signedUrlEndpoint) ||
  (props.kind === "draft"
    ? `/material/drafts/${encodeURIComponent(props.id)}/preview-url`
    : `/material/assets/${encodeURIComponent(props.id)}/preview-url`),
);
const directPreviewUrl = computed(() =>
  (props.preview?.url || props.previewUrl || "").trim(),
);
const isImage = computed(
  () =>
    normalizedType.value === "image" ||
    normalizedMime.value.startsWith("image/") ||
    [
      "jpg",
      "jpeg",
      "png",
      "gif",
      "bmp",
      "webp",
      "svg",
      "ico",
      "avif",
      "tiff",
    ].includes(normalizedExtension.value),
);
const isVideo = computed(
  () =>
    normalizedType.value === "video" ||
    normalizedMime.value.startsWith("video/") ||
    ["mp4", "webm", "ogg", "mov", "m4v"].includes(normalizedExtension.value),
);
const isAudio = computed(
  () =>
    normalizedType.value === "audio" ||
    normalizedMime.value.startsWith("audio/") ||
    ["mp3", "wav", "ogg", "m4a", "flac", "aac"].includes(
      normalizedExtension.value,
    ),
);
const isDocument = computed(
  () =>
    normalizedType.value === "document" ||
    (!isImage.value && !isVideo.value && !isAudio.value),
);
const previewMode = computed(() => {
  const mode = (props.preview?.mode || "").trim();
  if (mode) {
    return mode;
  }

  return isVideo.value || isAudio.value ? "signed_url" : "proxy";
});
const previewClass = computed(() => ({
  image: isImage.value,
  video: isVideo.value,
  audio: isAudio.value,
  document: isDocument.value,
  compact: props.compact === true,
}));
const fileExtensionLabel = computed(() =>
  (normalizedExtension.value || "DOC").slice(0, 5).toUpperCase(),
);
const fileMetaText = computed(() =>
  [props.mimeType || props.materialType || "文件", props.sizeReadable]
    .filter(Boolean)
    .join(" · "),
);

function revokeObjectUrl() {
  if (!objectUrl.value) {
    return;
  }

  if (objectUrl.value.startsWith("blob:")) {
    URL.revokeObjectURL(objectUrl.value);
  }
  objectUrl.value = "";
}

function canUseDirectPreviewUrl(url: string) {
  if (!url) {
    return false;
  }

  if (url.startsWith("blob:")) {
    return true;
  }

  if (!/^(https?:)?\/\//i.test(url)) {
    return false;
  }

  return !/\/api\/material\/.*\/preview/i.test(url);
}

function normalizeApiEndpoint(value?: string | null) {
  const raw = (value || "").trim();
  if (!raw) {
    return "";
  }

  if (/^https?:\/\//i.test(raw)) {
    try {
      const parsed = new URL(raw);
      return `${parsed.pathname}${parsed.search}`.replace(/^\/api(?=\/)/, "");
    } catch {
      return raw;
    }
  }

  return raw.replace(/^\/api(?=\/)/, "");
}

async function loadProxyPreview() {
  const blob = await fetchBlob(previewEndpoint.value);
  revokeObjectUrl();
  objectUrl.value = URL.createObjectURL(blob);
}

async function loadSignedPreview() {
  const result = await request<MaterialPreviewUrlResponse>(
    signedPreviewEndpoint.value,
  );
  const signedUrl = (result.url || "").trim();
  if (result.mode === "signed_url" && signedUrl) {
    revokeObjectUrl();
    objectUrl.value = signedUrl;
    return;
  }

  await loadProxyPreview();
}

async function loadPreview() {
  if (!props.id || isDocument.value || loading.value) {
    return;
  }

  const directUrl = directPreviewUrl.value;
  if (canUseDirectPreviewUrl(directUrl)) {
    revokeObjectUrl();
    objectUrl.value = directUrl;
    playZoomVideoIfNeeded();
    return;
  }

  loading.value = true;
  error.value = "";

  try {
    if (previewMode.value === "signed_url") {
      try {
        await loadSignedPreview();
      } catch {
        await loadProxyPreview();
      }
      return;
    }

    await loadProxyPreview();
  } catch (err) {
    error.value = getUserErrorMessage(err, "预览读取失败，点击重试");
  } finally {
    loading.value = false;
    playZoomVideoIfNeeded();
  }
}

function openZoom() {
  if (isDocument.value) {
    return;
  }

  zoomVisible.value = true;
  if (!objectUrl.value) {
    void loadPreview();
    return;
  }

  playZoomVideoIfNeeded();
}

function closeZoom() {
  zoomVisible.value = false;
}

function playZoomVideoIfNeeded() {
  if (!zoomVisible.value || !isVideo.value || !objectUrl.value) {
    return;
  }

  void nextTick(() => {
    const video = zoomVideoRef.value;
    if (!video || typeof video.play !== "function") {
      return;
    }

    const result = video.play();
    if (result && typeof result.catch === "function") {
      void result.catch(() => undefined);
    }
  });
}

function handlePreviewMediaError() {
  if (previewMode.value !== "signed_url" || signedUrlRetryCount.value >= 1) {
    return;
  }

  signedUrlRetryCount.value += 1;
  revokeObjectUrl();
  void loadPreview();
}

function handleVideoMetadata(event: Event) {
  if (!props.compact) {
    return;
  }

  const target = event.target as HTMLVideoElement | null;
  if (!target || !Number.isFinite(target.duration) || target.duration <= 0) {
    return;
  }

  try {
    target.currentTime = Math.min(0.1, target.duration / 10);
  } catch {
    // 部分跨域视频不允许主动 seek，浏览器仍会展示默认首帧。
  }
}

watch(
  () => [
    props.id,
    props.kind,
    props.materialType,
    props.mimeType,
    props.fileExtension,
    props.previewUrl,
    props.preview?.mode,
    props.preview?.endpoint,
    props.preview?.signedUrlEndpoint,
    props.preview?.url,
  ],
  () => {
    closeZoom();
    revokeObjectUrl();
    signedUrlRetryCount.value = 0;
    void loadPreview();
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  revokeObjectUrl();
});
</script>

<style scoped>
.material-preview {
  box-sizing: border-box;
  min-width: 0;
}

.image-button {
  display: block;
  width: 96px;
  height: 72px;
  padding: 0;
  overflow: hidden;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.media-button {
  position: relative;
  box-sizing: border-box;
  display: flex;
  width: 180px;
  height: 108px;
  min-width: 0;
  overflow: hidden;
  cursor: pointer;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.media-button.video-cover {
  background: #0f172a;
}

.media-button.audio-cover {
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px;
  text-align: center;
  background: linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%);
}

.media-poster {
  pointer-events: none;
}

.media-badge {
  position: absolute;
  right: 8px;
  bottom: 8px;
  padding: 3px 7px;
  color: #ffffff;
  font-size: 11px;
  font-weight: 700;
  line-height: 14px;
  background: rgba(15, 23, 42, 0.76);
  border-radius: 999px;
}

.audio-cover-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  color: #0f766e;
  font-size: 12px;
  font-weight: 700;
  background: #ccfbf1;
  border-radius: 50%;
}

.audio-cover-mark.large {
  width: 72px;
  height: 72px;
  font-size: 15px;
}

.audio-cover-name {
  display: -webkit-box;
  max-width: 100%;
  overflow: hidden;
  color: #0f172a;
  font-size: 12px;
  font-weight: 700;
  line-height: 16px;
  text-overflow: ellipsis;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.audio-cover-meta {
  color: #64748b;
  font-size: 11px;
}

.preview-image,
.preview-video {
  display: block;
  width: 100%;
  height: 100%;
}

.preview-video {
  min-width: 180px;
  max-width: 260px;
  height: 136px;
  background: #111827;
  border-radius: 8px;
}

.preview-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: #6b7280;
  font-size: 12px;
}

.file-info,
.audio-preview {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 10px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.file-mark {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  color: #0f766e;
  font-size: 10px;
  font-weight: 700;
  background: #ccfbf1;
  border-radius: 8px;
}

.file-mark.fallback {
  color: #475569;
  background: #e2e8f0;
}

.file-copy {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  gap: 3px;
}

.file-name,
.audio-title {
  overflow: hidden;
  color: #111827;
  font-size: 12px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-meta,
.audio-status {
  color: #64748b;
  font-size: 11px;
}

.audio-preview {
  flex-direction: column;
  align-items: stretch;
  width: 220px;
}

.preview-audio {
  width: 100%;
}

.preview-error {
  margin-top: 6px;
  padding: 0;
  color: #b91c1c;
  font-size: 11px;
  line-height: 1.4;
  text-align: left;
  background: transparent;
  border: 0;
}

.zoom-mask {
  position: fixed;
  z-index: 1000;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.72);
}

.zoom-panel {
  display: flex;
  flex-direction: column;
  width: min(920px, 96vw);
  height: min(720px, 88vh);
  overflow: hidden;
  background: #ffffff;
  border-radius: 8px;
}

.zoom-panel.media {
  width: min(880px, 94vw);
  height: auto;
  max-height: 88vh;
}

.zoom-header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 58px 12px 14px;
  border-bottom: 1px solid #e5e7eb;
}

.zoom-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: #111827;
  font-size: 14px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.zoom-close {
  position: absolute;
  top: 50%;
  right: 14px;
  display: flex;
  width: 30px;
  height: 30px;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0;
  color: #111827;
  font-size: 20px;
  line-height: 28px;
  background: #f3f4f6;
  border: 0;
  border-radius: 999px;
  transform: translateY(-50%);
}

.zoom-close::after {
  border: 0;
}

.zoom-body {
  display: flex;
  flex: 1;
  min-height: 0;
  align-items: center;
  justify-content: center;
  overflow: auto;
  background: #ffffff;
}

.zoom-image {
  flex: 1;
  width: 100%;
  min-height: 0;
}

.zoom-video {
  display: block;
  width: 100%;
  max-height: calc(88vh - 64px);
  background: #020617;
}

.zoom-audio-wrap {
  box-sizing: border-box;
  display: flex;
  width: min(520px, 100%);
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 34px 24px 38px;
}

.zoom-audio-name {
  max-width: 100%;
  overflow-wrap: anywhere;
  color: #0f172a;
  font-size: 15px;
  font-weight: 700;
  line-height: 22px;
  text-align: center;
}

.zoom-audio {
  width: 100%;
}

.zoom-loading {
  display: flex;
  flex: 1;
  min-height: 180px;
  align-items: center;
  justify-content: center;
  color: #64748b;
  font-size: 13px;
}
</style>
