<template>
  <view class="markdown-content" :class="{ typing: isTyping }">
    <template v-for="(block, blockIndex) in blocks" :key="`${block.type}-${blockIndex}`">
      <view
        v-if="block.type === 'heading'"
        class="md-block md-heading"
        :class="`level-${block.level}`"
      >
        <text
          v-for="(token, tokenIndex) in block.tokens"
          :key="`heading-${blockIndex}-${tokenIndex}`"
          :class="tokenClass(token)"
        >
          {{ token.text }}
        </text>
      </view>

      <view v-else-if="block.type === 'list-item'" class="md-block md-list-item">
        <text class="md-list-marker">{{ block.marker }}</text>
        <view class="md-list-content">
          <text
            v-for="(token, tokenIndex) in block.tokens"
            :key="`list-${blockIndex}-${tokenIndex}`"
            :class="tokenClass(token)"
          >
            {{ token.text }}
          </text>
        </view>
      </view>

      <view v-else-if="block.type === 'quote'" class="md-block md-quote">
        <text
          v-for="(token, tokenIndex) in block.tokens"
          :key="`quote-${blockIndex}-${tokenIndex}`"
          :class="tokenClass(token)"
        >
          {{ token.text }}
        </text>
      </view>

      <view v-else-if="block.type === 'code'" class="md-block md-code-block">
        <text>{{ block.text }}</text>
      </view>

      <scroll-view
        v-else-if="block.type === 'table'"
        class="md-block md-table-scroll"
        scroll-x
      >
        <view class="md-table" :style="{ minWidth: tableMinWidth(block.columnCount) }">
          <view class="md-table-row md-table-header">
            <view
              v-for="(header, headerIndex) in block.headers"
              :key="`table-header-${blockIndex}-${headerIndex}`"
              class="md-table-cell"
              :class="{ 'first-column': headerIndex === 0 }"
            >
              <text
                v-for="(token, tokenIndex) in header"
                :key="`table-header-token-${blockIndex}-${headerIndex}-${tokenIndex}`"
                :class="tokenClass(token)"
              >
                {{ token.text }}
              </text>
            </view>
          </view>

          <view
            v-for="(row, rowIndex) in block.rows"
            :key="`table-row-${blockIndex}-${rowIndex}`"
            class="md-table-row"
          >
            <view
              v-for="(cell, cellIndex) in row"
              :key="`table-cell-${blockIndex}-${rowIndex}-${cellIndex}`"
              class="md-table-cell"
              :class="{ 'first-column': cellIndex === 0 }"
            >
              <text
                v-for="(token, tokenIndex) in cell"
                :key="`table-cell-token-${blockIndex}-${rowIndex}-${cellIndex}-${tokenIndex}`"
                :class="tokenClass(token)"
              >
                {{ token.text }}
              </text>
            </view>
          </view>
        </view>
      </scroll-view>

      <view v-else class="md-block md-paragraph">
        <text
          v-for="(token, tokenIndex) in block.tokens"
          :key="`paragraph-${blockIndex}-${tokenIndex}`"
          :class="tokenClass(token)"
        >
          {{ token.text }}
        </text>
      </view>
    </template>

    <text v-if="isTyping" class="typing-cursor"></text>
  </view>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";

type InlineToken = {
  type: "text" | "strong" | "code" | "link";
  text: string;
};

type MarkdownBlock =
  | {
      type: "heading";
      level: number;
      tokens: InlineToken[];
    }
  | {
      type: "paragraph" | "quote";
      tokens: InlineToken[];
    }
  | {
      type: "list-item";
      marker: string;
      tokens: InlineToken[];
    }
  | {
      type: "code";
      text: string;
    }
  | {
      type: "table";
      headers: InlineToken[][];
      rows: InlineToken[][][];
      columnCount: number;
    };

const props = defineProps<{
  content: string;
  animate?: boolean;
}>();

const emit = defineEmits<{
  "animation-finished": [];
  "typing-progress": [];
}>();

const displayedContent = ref("");
const isTyping = ref(false);
let typingTimer: ReturnType<typeof setInterval> | null = null;

const blocks = computed(() => parseMarkdown(displayedContent.value));

watch(
  () => [props.content, props.animate] as const,
  () => {
    restartTyping();
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  stopTyping();
});

function restartTyping() {
  stopTyping();

  const content = props.content || "";
  if (!props.animate || !content) {
    displayedContent.value = content;
    isTyping.value = false;
    return;
  }

  const chars = Array.from(content);
  let index = 0;
  let tickCount = 0;
  const chunkSize = chars.length > 1200 ? 8 : chars.length > 600 ? 4 : 2;

  displayedContent.value = "";
  isTyping.value = true;
  typingTimer = setInterval(() => {
    index = Math.min(chars.length, index + chunkSize);
    displayedContent.value = chars.slice(0, index).join("");
    tickCount += 1;

    if (tickCount % 4 === 0) {
      emit("typing-progress");
    }

    if (index >= chars.length) {
      stopTyping(false);
      displayedContent.value = content;
      emit("typing-progress");
      emit("animation-finished");
    }
  }, 18);
}

function stopTyping(resetState = true) {
  if (typingTimer) {
    clearInterval(typingTimer);
    typingTimer = null;
  }

  if (resetState) {
    isTyping.value = false;
  } else {
    isTyping.value = false;
  }
}

function parseMarkdown(source: string): MarkdownBlock[] {
  const normalized = source.replace(/\r\n/g, "\n").trimEnd();
  if (!normalized) {
    return [];
  }

  const lines = normalized.split("\n");
  const blocks: MarkdownBlock[] = [];
  let paragraphLines: string[] = [];
  let codeLines: string[] = [];
  let inCodeBlock = false;
  let index = 0;

  const flushParagraph = () => {
    if (!paragraphLines.length) {
      return;
    }

    blocks.push({
      type: "paragraph",
      tokens: parseInline(paragraphLines.join("\n")),
    });
    paragraphLines = [];
  };

  const flushCode = () => {
    blocks.push({
      type: "code",
      text: codeLines.join("\n"),
    });
    codeLines = [];
  };

  while (index < lines.length) {
    const line = lines[index] || "";
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      if (inCodeBlock) {
        flushCode();
        inCodeBlock = false;
      } else {
        flushParagraph();
        inCodeBlock = true;
        codeLines = [];
      }
      index += 1;
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      index += 1;
      continue;
    }

    if (!trimmed) {
      flushParagraph();
      index += 1;
      continue;
    }

    if (isMarkdownTable(lines, index)) {
      flushParagraph();

      const headerCells = splitMarkdownTableRow(lines[index] || "");
      const columnCount = headerCells.length;
      const rows: string[][] = [];
      index += 2;

      while (
        index < lines.length &&
        isMarkdownTableRow(lines[index] || "") &&
        !isMarkdownTableSeparator(lines[index] || "")
      ) {
        rows.push(
          normalizeTableRow(splitMarkdownTableRow(lines[index] || ""), columnCount),
        );
        index += 1;
      }

      blocks.push({
        type: "table",
        headers: normalizeTableRow(headerCells, columnCount).map(parseInline),
        rows: rows.map((row) => row.map(parseInline)),
        columnCount,
      });
      continue;
    }

    const headingMatch = /^(#{1,3})\s+(.+)$/.exec(trimmed);
    if (headingMatch) {
      flushParagraph();
      blocks.push({
        type: "heading",
        level: headingMatch[1].length,
        tokens: parseInline(headingMatch[2]),
      });
      index += 1;
      continue;
    }

    const listMatch = /^((?:[-*+])|(?:\d+[.)]))\s+(.+)$/.exec(trimmed);
    if (listMatch) {
      flushParagraph();
      blocks.push({
        type: "list-item",
        marker: /^\d/.test(listMatch[1]) ? listMatch[1] : "•",
        tokens: parseInline(listMatch[2]),
      });
      index += 1;
      continue;
    }

    const quoteMatch = /^>\s?(.+)$/.exec(trimmed);
    if (quoteMatch) {
      flushParagraph();
      blocks.push({
        type: "quote",
        tokens: parseInline(quoteMatch[1]),
      });
      index += 1;
      continue;
    }

    paragraphLines.push(line);
    index += 1;
  }

  if (inCodeBlock) {
    flushCode();
  }
  flushParagraph();

  return blocks;
}

function isMarkdownTable(lines: string[], index: number) {
  return (
    isMarkdownTableRow(lines[index] || "") &&
    isMarkdownTableSeparator(lines[index + 1] || "")
  );
}

function isMarkdownTableRow(source: string) {
  return splitMarkdownTableRow(source).length >= 2;
}

function isMarkdownTableSeparator(source: string) {
  const cells = splitMarkdownTableRow(source);

  return (
    cells.length >= 2 &&
    cells.every((cell) => /^:?-{3,}:?$/.test(cell.replace(/\s+/g, "")))
  );
}

function splitMarkdownTableRow(source: string) {
  const trimmed = source.trim();

  if (!trimmed.includes("|")) {
    return [];
  }

  return trimmed
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function normalizeTableRow(cells: string[], columnCount: number) {
  if (cells.length >= columnCount) {
    return cells.slice(0, columnCount);
  }

  return [
    ...cells,
    ...Array.from({ length: columnCount - cells.length }, () => ""),
  ];
}

function parseInline(source: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let index = 0;

  const pushText = (text: string) => {
    if (!text) {
      return;
    }

    const previous = tokens[tokens.length - 1];
    if (previous?.type === "text") {
      previous.text += text;
      return;
    }

    tokens.push({ type: "text", text });
  };

  while (index < source.length) {
    if (source.startsWith("**", index)) {
      const end = source.indexOf("**", index + 2);
      if (end > index + 2) {
        tokens.push({
          type: "strong",
          text: source.slice(index + 2, end),
        });
        index = end + 2;
        continue;
      }
    }

    if (source[index] === "`") {
      const end = source.indexOf("`", index + 1);
      if (end > index + 1) {
        tokens.push({
          type: "code",
          text: source.slice(index + 1, end),
        });
        index = end + 1;
        continue;
      }
    }

    if (source[index] === "[") {
      const labelEnd = source.indexOf("]", index + 1);
      const linkStart = labelEnd >= 0 ? source.indexOf("(", labelEnd) : -1;
      const linkEnd = linkStart >= 0 ? source.indexOf(")", linkStart) : -1;

      if (labelEnd > index + 1 && linkStart === labelEnd + 1 && linkEnd > linkStart + 1) {
        tokens.push({
          type: "link",
          text: source.slice(index + 1, labelEnd),
        });
        index = linkEnd + 1;
        continue;
      }
    }

    const nextSpecialIndexes = ["**", "`", "["]
      .map((marker) => source.indexOf(marker, index + 1))
      .filter((item) => item >= 0);
    const nextIndex = nextSpecialIndexes.length
      ? Math.min(...nextSpecialIndexes)
      : source.length;
    pushText(source.slice(index, nextIndex));
    index = nextIndex;
  }

  return tokens;
}

function tokenClass(token: InlineToken) {
  return {
    "md-inline": true,
    "md-strong": token.type === "strong",
    "md-code": token.type === "code",
    "md-link": token.type === "link",
  };
}

function tableMinWidth(columnCount: number) {
  return `${Math.max(520, columnCount * 220)}px`;
}
</script>

<style scoped>
.markdown-content {
  display: block;
  max-width: 100%;
  overflow-wrap: anywhere;
  color: inherit;
  font-size: 14px;
  line-height: 1.75;
  word-break: break-word;
}

.md-block {
  display: block;
  max-width: 100%;
}

.md-block + .md-block {
  margin-top: 6px;
}

.md-heading {
  color: inherit;
  font-weight: 800;
  line-height: 1.55;
}

.md-heading.level-1 {
  font-size: 17px;
}

.md-heading.level-2 {
  font-size: 16px;
}

.md-heading.level-3 {
  font-size: 15px;
}

.md-paragraph {
  white-space: pre-wrap;
}

.md-list-item {
  display: flex;
  align-items: flex-start;
  gap: 7px;
}

.md-list-marker {
  flex: 0 0 auto;
  min-width: 16px;
  color: #64748b;
  font-size: 13px;
  line-height: 1.75;
}

.md-list-content {
  min-width: 0;
  flex: 1;
}

.md-quote {
  padding-left: 10px;
  color: #4b5563;
  border-left: 3px solid #d7e1ef;
}

.md-code-block {
  padding: 8px 10px;
  overflow-wrap: anywhere;
  color: #243041;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
    monospace;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  background: #f5f7fb;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
}

.md-table-scroll {
  max-width: 100%;
  margin: 8px 0;
  white-space: normal;
}

.md-table {
  display: block;
  overflow: hidden;
  color: #243041;
  white-space: normal;
  background: #ffffff;
  border: 1px solid #dbe3ef;
  border-radius: 6px;
}

.md-table-row {
  display: flex;
  align-items: stretch;
}

.md-table-cell {
  box-sizing: border-box;
  display: block;
  flex: 1 0 220px;
  min-width: 180px;
  padding: 8px 10px;
  color: #334155;
  font-size: 13px;
  font-weight: 400;
  line-height: 1.65;
  vertical-align: top;
  white-space: normal;
  word-break: break-word;
  border-right: 1px solid #dbe3ef;
  border-bottom: 1px solid #dbe3ef;
}

.md-table-cell.first-column {
  flex: 0 0 128px;
  min-width: 128px;
  color: #111827;
  font-weight: 700;
  white-space: nowrap;
}

.md-table-header .md-table-cell {
  color: #111827;
  font-weight: 800;
  background: #f1f5f9;
}

.md-table-row .md-table-cell:last-child {
  border-right: 0;
}

.md-table-row:last-child .md-table-cell {
  border-bottom: 0;
}

.md-inline {
  color: inherit;
}

.md-strong {
  font-weight: 800;
}

.md-code {
  padding: 1px 4px;
  color: #334155;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
    monospace;
  font-size: 12px;
  background: #eef2f7;
  border-radius: 4px;
}

.md-link {
  color: #1267ff;
  font-weight: 700;
}

.typing-cursor {
  display: inline-block;
  width: 7px;
  height: 16px;
  margin-left: 2px;
  vertical-align: -2px;
  background: currentcolor;
  border-radius: 1px;
  opacity: 0.5;
  animation: cursor-blink 0.9s steps(2, start) infinite;
}

@keyframes cursor-blink {
  0%,
  45% {
    opacity: 0.55;
  }
  46%,
  100% {
    opacity: 0;
  }
}
</style>
