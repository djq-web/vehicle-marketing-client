<template>
  <view class="report-markdown">
    <rich-text :nodes="renderedHtml"></rich-text>
  </view>
</template>

<script setup lang="ts">
import MarkdownIt from "markdown-it";
import { computed } from "vue";

const props = defineProps<{
  content: string;
}>();

const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
});

const renderedHtml = computed(() => markdown.render(props.content || ""));
</script>

<style scoped>
.report-markdown {
  max-width: 100%;
  overflow-x: auto;
  color: #243041;
  font-size: 13px;
  line-height: 1.8;
  word-break: break-word;
}

.report-markdown :deep(h1),
.report-markdown :deep(h2),
.report-markdown :deep(h3),
.report-markdown :deep(h4) {
  margin: 18px 0 10px;
  color: #111827;
  font-weight: 800;
  line-height: 1.45;
}

.report-markdown :deep(h1) {
  font-size: 22px;
}

.report-markdown :deep(h2) {
  font-size: 18px;
}

.report-markdown :deep(h3) {
  font-size: 16px;
}

.report-markdown :deep(h4) {
  font-size: 14px;
}

.report-markdown :deep(p) {
  margin: 8px 0;
}

.report-markdown :deep(ul),
.report-markdown :deep(ol) {
  margin: 8px 0;
  padding-left: 22px;
}

.report-markdown :deep(li) {
  margin: 4px 0;
}

.report-markdown :deep(strong) {
  color: #111827;
  font-weight: 800;
}

.report-markdown :deep(blockquote) {
  margin: 12px 0;
  padding: 8px 12px;
  color: #475569;
  background: #f8fafc;
  border-left: 3px solid #1267ff;
  border-radius: 4px;
}

.report-markdown :deep(code) {
  padding: 2px 5px;
  color: #334155;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    "Liberation Mono", monospace;
  font-size: 12px;
  background: #eef2f7;
  border-radius: 4px;
}

.report-markdown :deep(pre) {
  margin: 12px 0;
  padding: 12px;
  overflow-x: auto;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.report-markdown :deep(pre code) {
  padding: 0;
  background: transparent;
}

.report-markdown :deep(table) {
  width: 100%;
  min-width: 620px;
  margin: 14px 0;
  border-collapse: collapse;
  table-layout: auto;
}

.report-markdown :deep(th),
.report-markdown :deep(td) {
  padding: 9px 10px;
  text-align: left;
  vertical-align: top;
  border: 1px solid #dbe3ef;
}

.report-markdown :deep(th) {
  color: #111827;
  font-weight: 800;
  background: #f1f5f9;
}

.report-markdown :deep(td) {
  background: #ffffff;
}

.report-markdown :deep(a) {
  color: #1267ff;
  font-weight: 700;
  text-decoration: none;
}

@media (max-width: 760px) {
  .report-markdown {
    font-size: 26rpx;
  }

  .report-markdown :deep(h1) {
    font-size: 36rpx;
  }

  .report-markdown :deep(h2) {
    font-size: 32rpx;
  }

  .report-markdown :deep(h3) {
    font-size: 30rpx;
  }
}
</style>
