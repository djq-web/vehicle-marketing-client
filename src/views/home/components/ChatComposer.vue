<template>
  <section ref="composerRef" class="composer">
    <input
      ref="fileInputRef"
      class="file-input"
      type="file"
      accept=".pdf,.doc,.docx,.txt,.md,.xlsx,.xls"
      @change="handleFileChange"
    />
    <div class="editor-wrap" @click="focusEditor()">
      <p v-if="!message" class="message-placeholder">
        发消息......输入“@”选择看板、输入“/”选择技能
      </p>
      <div
        ref="editableRef"
        class="message-input"
        role="textbox"
        aria-multiline="true"
        translate="no"
        :contenteditable="props.disabled ? 'false' : 'true'"
        :aria-disabled="props.disabled"
        @input="handleEditableInput"
        @paste="handlePaste"
        @focus="handleEditorFocus"
        @blur="handleEditorBlur"
        @pointerup="handleEditorPointerEnd"
        @keydown="handleEditorKeydown"
        @compositionstart="isComposing = true"
        @compositionend="handleCompositionEnd"
      ></div>
    </div>

    <Teleport to="body">
      <Transition name="board-menu">
        <div
          v-if="boardMenu.visible"
          ref="boardMenuRef"
          class="board-mention-menu"
          :style="boardMenuStyle"
          @mousedown.prevent
        >
          <div class="board-menu-title">选择看板</div>
          <div class="board-menu-list">
            <div v-if="filteredBoards.length === 0" class="board-empty">
              没有匹配的看板
            </div>
            <template v-else>
              <button
                v-for="(board, index) in filteredBoards"
                :key="board.id"
                class="board-option"
                :class="{ active: index === boardMenu.activeIndex }"
                type="button"
                @mouseenter="boardMenu.activeIndex = index"
                @mousedown.prevent="selectBoard(board)"
              >
                <span class="board-icon">
                  <img :src="board.icon" :alt="board.name" />
                </span>
                <span class="board-copy">
                  <span class="board-name-row">
                    <span class="board-name">{{ board.name }}</span>
                    <span class="board-alias">@{{ board.mention }}</span>
                  </span>
                  <span class="board-description">
                    {{ board.description }}
                  </span>
                </span>
              </button>
            </template>
          </div>
        </div>
      </Transition>
    </Teleport>

    <div class="composer-footer">
      <div class="quick-actions">
        <button
          class="plus"
          type="button"
          :disabled="props.disabled"
          @click="fileInputRef?.click()"
        >
          +
        </button>
        <button
          v-for="action in quickActions"
          :key="action.label"
          class="quick-action"
          type="button"
          :disabled="props.disabled"
          @click="handleQuickAction(action)"
        >
          {{ action.label }}
        </button>
        <button class="quick-action more" type="button">
          <el-icon>
            <Grid />
          </el-icon>
          更多
        </button>
      </div>
      <button
        class="send-button"
        type="button"
        aria-label="发送"
        :disabled="props.disabled || !message.trim()"
        @click="handleSend"
      >
        <el-icon>
          <Top />
        </el-icon>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Grid, Top } from "@element-plus/icons-vue";
import type { RouteLocationRaw } from "vue-router";

const props = withDefaults(
  defineProps<{
    disabled?: boolean;
  }>(),
  {
    disabled: false,
  },
);

const emit = defineEmits<{
  send: [content: string];
  upload: [file: File];
}>();

type BoardOption = {
  id: string;
  name: string;
  mention: string;
  description: string;
  icon: string;
  route: RouteLocationRaw;
  searchText: string;
};

type QuickAction =
  | { label: string; type: "board" }
  | { label: string; type: "upload" }
  | { label: string; type: "prompt"; prompt: string };

const router = useRouter();
const message = ref("");
const fileInputRef = ref<HTMLInputElement>();
const editableRef = ref<HTMLDivElement>();
const composerRef = ref<HTMLElement>();
const boardMenuRef = ref<HTMLElement>();
const isComposing = ref(false);

const iconMap = {
  brandStrategy: new URL("../../../assets/svg/brand-strategy.svg", import.meta.url)
    .href,
  keyMetrics: new URL("../../../assets/svg/key-metrics.svg", import.meta.url)
    .href,
  marketingOperations: new URL(
    "../../../assets/svg/marketing-operations.svg",
    import.meta.url,
  ).href,
  marketingCalendar: new URL(
    "../../../assets/svg/marketing-calendar.svg",
    import.meta.url,
  ).href,
  marketFeedback: new URL("../../../assets/svg/market-feedback.svg", import.meta.url)
    .href,
  ecologicalPartner: new URL(
    "../../../assets/svg/ecological-partner.svg",
    import.meta.url,
  ).href,
};

const buildSearchText = (items: string[]) =>
  items.join(" ").toLowerCase().replace(/[\s-]+/g, "");

const boardOptions: BoardOption[] = ([
  {
    id: "brand-strategy",
    name: "品牌战略看板",
    mention: "品牌战略",
    description: "锚定方向，塑造品牌心智",
    icon: iconMap.brandStrategy,
    route: { name: "brand-strategy" },
  },
  {
    id: "key-metrics",
    name: "核心指标看板",
    mention: "核心指标",
    description: "数据驱动业务增长",
    icon: iconMap.keyMetrics,
    route: { name: "key-metrics" },
  },
  {
    id: "marketing-operations",
    name: "营销运营看板",
    mention: "营销运营",
    description: "全链路营销提效增长",
    icon: iconMap.marketingOperations,
    route: { name: "marketing-operations" },
  },
  {
    id: "marketing-calendar",
    name: "营销日历看板",
    mention: "营销日历",
    description: "精准把控营销节点",
    icon: iconMap.marketingCalendar,
    route: { name: "marketing-calendar" },
  },
  {
    id: "market-feedback",
    name: "市场反馈看板",
    mention: "市场反馈",
    description: "倾听用户优化策略",
    icon: iconMap.marketFeedback,
    route: { name: "market-feedback" },
  },
  {
    id: "ecological-partner",
    name: "生态伙伴看板",
    mention: "生态伙伴",
    description: "携手同行共建生态",
    icon: iconMap.ecologicalPartner,
    route: { name: "ecological-partner" },
  },
] satisfies Array<Omit<BoardOption, "searchText">>).map((board) => ({
  ...board,
  searchText: buildSearchText([
    board.id,
    board.name,
    board.mention,
    board.description,
  ]),
}));

const quickActions: QuickAction[] = [
  { label: "@看板", type: "board" },
  { label: "/ 任务管理", type: "prompt", prompt: "创建任务管理计划" },
  { label: "/ 战略诊断", type: "prompt", prompt: "开始战略诊断" },
  { label: "/ 战略拆解", type: "prompt", prompt: "生成19点战略框架" },
  { label: "/ 上传素材", type: "upload" },
  { label: "/ 图文营销", type: "prompt", prompt: "生成图文营销方案" },
];

const boardMenu = ref({
  visible: false,
  query: "",
  start: 0,
  end: 0,
  activeIndex: 0,
});

const boardMenuStyle = ref({
  left: "0px",
  top: "0px",
  width: "320px",
});

const boardMentionAliases = new Set(
  boardOptions.flatMap((board) => [
    normalizeMentionAlias(board.id),
    normalizeMentionAlias(board.name),
    normalizeMentionAlias(board.mention),
  ]),
);

const filteredBoards = computed(() => {
  const query = normalizeSearch(boardMenu.value.query);
  if (!query) {
    return boardOptions;
  }

  return boardOptions.filter((board) => board.searchText.includes(query));
});

function normalizeSearch(value: string) {
  return value.trim().toLowerCase().replace(/[\s-]+/g, "");
}

function normalizeMentionAlias(value: string) {
  return normalizeSearch(value.replace(/^@+/, ""));
}

function normalizeEditableText(value: string) {
  const cleaned = value.replace(/\u200B/g, "").replace(/\u00a0/g, " ");
  return cleaned.trim() === "" ? "" : cleaned;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildEditableHtml(value: string) {
  if (!value) {
    return "";
  }

  const parts: string[] = [];
  const mentionPattern = /@([^\s@]{1,24})/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null = null;

  while ((match = mentionPattern.exec(value)) !== null) {
    const sourceText = match[0] ?? "";
    const label = match[1] ?? "";
    const index = match.index ?? 0;
    parts.push(escapeHtml(value.slice(lastIndex, index)));

    if (boardMentionAliases.has(normalizeMentionAlias(label))) {
      parts.push(
        `<span class="board-mention-token">${escapeHtml(sourceText)}</span>`,
      );
    } else {
      parts.push(escapeHtml(sourceText));
    }

    lastIndex = index + sourceText.length;
  }

  parts.push(escapeHtml(value.slice(lastIndex)));
  return parts.join("").replace(/\n/g, "<br>");
}

function renderEditableText(value: string, caretOffset?: number | null) {
  const editable = editableRef.value;
  if (!editable) {
    return;
  }

  editable.innerHTML = buildEditableHtml(value);

  if (caretOffset !== undefined && caretOffset !== null) {
    setCaretTextOffset(caretOffset);
  }
}

function getEditableRange(selection: Selection, editable: HTMLDivElement) {
  if (selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0);
  const container = range.commonAncestorContainer;
  return container && editable.contains(container) ? range : null;
}

function getSelectionRange() {
  const editable = editableRef.value;
  if (!editable) {
    return null;
  }

  const selection = window.getSelection();
  if (!selection) {
    return null;
  }

  return getEditableRange(selection, editable);
}

function createRangeAtEnd(editable: HTMLDivElement) {
  const range = document.createRange();
  range.selectNodeContents(editable);
  range.collapse(false);
  return range;
}

function getCaretTextOffset() {
  const editable = editableRef.value;
  const range = getSelectionRange();
  if (!editable || !range || !range.collapsed) {
    return null;
  }

  const preCaretRange = range.cloneRange();
  preCaretRange.selectNodeContents(editable);
  preCaretRange.setEnd(range.endContainer, range.endOffset);
  return preCaretRange.toString().length;
}

function setCaretTextOffset(offset: number) {
  const editable = editableRef.value;
  if (!editable) {
    return;
  }

  const targetOffset = Math.max(0, offset);
  const walker = document.createTreeWalker(editable, NodeFilter.SHOW_TEXT);
  let currentOffset = 0;
  let node = walker.nextNode() as Text | null;

  while (node) {
    const nextOffset = currentOffset + node.data.length;

    if (targetOffset <= nextOffset) {
      const range = document.createRange();
      range.setStart(node, targetOffset - currentOffset);
      range.collapse(true);

      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      return;
    }

    currentOffset = nextOffset;
    node = walker.nextNode() as Text | null;
  }

  const range = createRangeAtEnd(editable);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

function getEditableClientRect() {
  return editableRef.value?.getBoundingClientRect() ?? null;
}

function getCaretClientRect() {
  const editable = editableRef.value;
  const range = getSelectionRange();
  if (!editable || !range || !range.collapsed) {
    return null;
  }

  const rect = range.getClientRects()[0] ?? range.getBoundingClientRect();
  if (rect && (rect.width > 0 || rect.height > 0)) {
    return rect;
  }

  const caretOffset = getCaretTextOffset();
  const marker = document.createElement("span");
  marker.textContent = "\u200B";
  marker.style.cssText =
    "display:inline-block;width:0;height:1em;overflow:hidden;line-height:inherit;";
  range.insertNode(marker);
  const markerRect = marker.getBoundingClientRect();
  marker.remove();
  editable.normalize();

  if (caretOffset !== null) {
    setCaretTextOffset(caretOffset);
  }

  return markerRect;
}

async function focusEditor(options: { moveCaretToEnd?: boolean } = {}) {
  if (props.disabled) {
    return;
  }

  await nextTick();
  const editable = editableRef.value;
  if (!editable) {
    return;
  }

  const wasFocused = document.activeElement === editable;
  editable.focus({ preventScroll: true });

  if (options.moveCaretToEnd === false || wasFocused) {
    return;
  }

  const range = createRangeAtEnd(editable);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

function insertPlainTextAtCursor(text: string) {
  const editable = editableRef.value;
  if (!editable) {
    return;
  }

  const selection = window.getSelection();
  let range = selection ? getEditableRange(selection, editable) : null;

  if (!range) {
    range = createRangeAtEnd(editable);
    selection?.removeAllRanges();
    selection?.addRange(range);
  }

  range.deleteContents();
  const textNode = document.createTextNode(text);
  range.insertNode(textNode);
  range.setStartAfter(textNode);
  range.collapse(true);
  selection?.removeAllRanges();
  selection?.addRange(range);
}

function syncMessageFromEditable(event: Event) {
  const caretOffset = getCaretTextOffset();
  const rawValue = (event.target as HTMLDivElement).innerText;
  const normalizedValue = normalizeEditableText(rawValue);
  message.value = normalizedValue;

  if (!isComposing.value) {
    renderEditableText(
      normalizedValue,
      caretOffset === null ? null : Math.min(caretOffset, normalizedValue.length),
    );
  }
}

function handleEditableInput(event: Event) {
  syncMessageFromEditable(event);
  updateBoardMenu();
}

function handleCompositionEnd(event: CompositionEvent) {
  isComposing.value = false;
  syncMessageFromEditable(event);
  updateBoardMenu();
}

function handlePaste(event: ClipboardEvent) {
  event.preventDefault();
  const plainText = event.clipboardData?.getData("text/plain") ?? "";
  insertPlainTextAtCursor(plainText);
  message.value = normalizeEditableText(editableRef.value?.innerText ?? "");
  renderEditableText(message.value, getCaretTextOffset());
  updateBoardMenu();
}

function resolveBoardTriggerAtCaret() {
  const caret = getCaretTextOffset();
  if (caret === null || caret === undefined) {
    return undefined;
  }

  const beforeCaret = message.value.slice(0, caret);
  const match = beforeCaret.match(/(^|[\s\n])@([^\s@]{0,24})$/);
  if (!match) {
    return undefined;
  }

  const sourceText = match[0] ?? "";
  const prefix = match[1] ?? "";
  return {
    start: caret - sourceText.length + prefix.length,
    end: caret,
    query: match[2] ?? "",
  };
}

async function updateBoardMenu(options: { force?: boolean } = {}) {
  await nextTick();

  if (props.disabled) {
    closeBoardMenu();
    return;
  }

  const caret = getCaretTextOffset();
  const trigger = options.force
    ? {
        start: caret ?? message.value.length,
        end: caret ?? message.value.length,
        query: "",
      }
    : resolveBoardTriggerAtCaret();

  if (!trigger) {
    closeBoardMenu();
    return;
  }

  boardMenu.value = {
    visible: true,
    query: trigger.query,
    start: trigger.start,
    end: trigger.end,
    activeIndex: 0,
  };

  await nextTick();
  updateBoardMenuPosition();
}

function updateBoardMenuPosition() {
  const rect =
    getCaretClientRect() ??
    getEditableClientRect() ??
    composerRef.value?.getBoundingClientRect();

  const viewportWidth = window.innerWidth || 0;
  const viewportHeight = window.innerHeight || 0;
  const menuWidth = Math.min(352, Math.max(288, viewportWidth - 32));
  const estimatedMenuHeight = Math.min(
    408,
    37 + Math.max(1, filteredBoards.value.length) * 62,
  );
  const spaceBelow = rect ? viewportHeight - rect.bottom : viewportHeight;
  const left = rect
    ? Math.min(
        Math.max(16, rect.left - 12),
        Math.max(16, viewportWidth - menuWidth - 16),
      )
    : 16;
  const top = rect
    ? spaceBelow >= Math.min(estimatedMenuHeight, 220)
      ? rect.bottom + 8
      : Math.max(16, rect.top - estimatedMenuHeight - 8)
    : 96;

  boardMenuStyle.value = {
    left: `${Math.round(left)}px`,
    top: `${Math.round(top)}px`,
    width: `${Math.round(menuWidth)}px`,
  };
}

function closeBoardMenu() {
  boardMenu.value.visible = false;
  boardMenu.value.query = "";
  boardMenu.value.activeIndex = 0;
}

async function openBoardMenuFromAction() {
  await focusEditor({ moveCaretToEnd: true });
  updateBoardMenu({ force: true });
}

function moveBoardActiveIndex(delta: number) {
  const count = filteredBoards.value.length;
  if (!count) {
    return;
  }

  boardMenu.value.activeIndex =
    (boardMenu.value.activeIndex + delta + count) % count;
}

function selectActiveBoard() {
  const board =
    filteredBoards.value[boardMenu.value.activeIndex] ?? filteredBoards.value[0];

  if (board) {
    selectBoard(board);
  }
}

async function selectBoard(board: BoardOption) {
  if (props.disabled) {
    return;
  }

  message.value = "";
  renderEditableText("");
  closeBoardMenu();
  await router.push(board.route).catch(() => undefined);
}

function handleEditorKeydown(event: KeyboardEvent) {
  if (boardMenu.value.visible) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveBoardActiveIndex(1);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      moveBoardActiveIndex(-1);
      return;
    }

    if (event.key === "Enter" || event.key === "Tab") {
      event.preventDefault();
      selectActiveBoard();
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeBoardMenu();
      return;
    }
  }

  if (event.key === "Enter" && !event.shiftKey && !isComposing.value) {
    event.preventDefault();
    handleSend();
  }
}

function handleEditorFocus() {
  updateBoardMenu();
}

function handleEditorBlur() {
  window.setTimeout(() => closeBoardMenu(), 120);
}

function handleEditorPointerEnd() {
  window.requestAnimationFrame(() => updateBoardMenu());
}

const handleSend = () => {
  const content = message.value.trim();

  if (!content) {
    return;
  }

  emit("send", content);
  message.value = "";
  renderEditableText("");
};

const handleQuickAction = (action: QuickAction) => {
  if (action.type === "board") {
    openBoardMenuFromAction();
    return;
  }

  if (action.type === "upload") {
    fileInputRef.value?.click();
    return;
  }

  message.value = action.prompt;
  renderEditableText(message.value);
  handleSend();
};

const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (file) {
    emit("upload", file);
  }

  input.value = "";
};

function handleDocumentPointerDown(event: PointerEvent) {
  const target = event.target as Node | null;

  if (
    target &&
    (composerRef.value?.contains(target) || boardMenuRef.value?.contains(target))
  ) {
    return;
  }

  closeBoardMenu();
}

function addMenuListeners() {
  document.addEventListener("pointerdown", handleDocumentPointerDown);
  window.addEventListener("resize", updateBoardMenuPosition);
  window.addEventListener("scroll", updateBoardMenuPosition, true);
}

function removeMenuListeners() {
  document.removeEventListener("pointerdown", handleDocumentPointerDown);
  window.removeEventListener("resize", updateBoardMenuPosition);
  window.removeEventListener("scroll", updateBoardMenuPosition, true);
}

watch(
  () => boardMenu.value.visible,
  (visible) => {
    if (visible) {
      addMenuListeners();
    } else {
      removeMenuListeners();
    }
  },
);

watch(
  () => props.disabled,
  (disabled) => {
    if (disabled) {
      closeBoardMenu();
    }
  },
);

onBeforeUnmount(removeMenuListeners);
</script>

<style scoped lang="scss">
.composer {
  position: absolute;
  right: 16%;
  bottom: 0;
  left: 16%;
  min-height: 74px;
  padding: 12px 7px 7px 15px;
  background: #ffffff;
  border: 1px solid #98c5ff;
  border-radius: 11px;
  box-shadow:
    0 0 0 1px rgb(31 126 255 / 5%),
    0 4px 16px rgb(33 118 255 / 25%);
}

.file-input {
  display: none;
}

.editor-wrap {
  position: relative;
  min-height: 34px;
}

.message-placeholder {
  position: absolute;
  top: 0;
  right: 8px;
  left: 0;
  margin: 0;
  color: #9aa3af;
  font-size: 12px;
  line-height: 20px;
  pointer-events: none;
}

.message-input {
  display: block;
  width: 100%;
  min-height: 34px;
  max-height: 74px;
  padding: 0 8px 0 0;
  color: #1f2733;
  font-size: 12px;
  line-height: 20px;
  white-space: pre-wrap;
  word-break: break-word;
  overflow-y: auto;
  border: 0;
  outline: none;
  background: transparent;

  &[contenteditable="false"] {
    cursor: not-allowed;
  }

  :deep(.board-mention-token) {
    color: #1267ff;
    font-weight: 700;
  }
}

.board-mention-menu {
  position: fixed;
  z-index: 3000;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #e8eef8;
  border-radius: 12px;
  box-shadow:
    0 16px 44px rgb(24 55 105 / 18%),
    0 0 0 1px rgb(18 103 255 / 4%);
}

.board-menu-title {
  height: 37px;
  padding: 0 13px;
  display: flex;
  align-items: center;
  color: #7a8494;
  font-size: 12px;
  border-bottom: 1px solid #eef2f7;
}

.board-menu-list {
  max-height: 372px;
  padding: 6px;
  overflow-y: auto;
}

.board-empty {
  padding: 14px 10px;
  color: #98a2b3;
  font-size: 12px;
}

.board-option {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 58px;
  gap: 10px;
  padding: 9px 10px;
  color: #1f2733;
  text-align: left;
  border-radius: 9px;
  transition:
    background 0.15s ease,
    transform 0.15s ease;

  &:hover,
  &.active {
    background: #f2f7ff;
  }

  &.active {
    transform: translateX(1px);
  }
}

.board-icon {
  display: grid;
  flex: 0 0 auto;
  width: 34px;
  height: 34px;
  place-items: center;
  overflow: hidden;
  background: #f6f9ff;
  border-radius: 9px;

  img {
    width: 30px;
    height: 30px;
    object-fit: contain;
    display: block;
  }
}

.board-copy {
  min-width: 0;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 3px;
}

.board-name-row {
  display: flex;
  align-items: baseline;
  min-width: 0;
  gap: 8px;
}

.board-name {
  min-width: 0;
  color: #1f2733;
  font-size: 13px;
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.board-alias {
  flex: 0 0 auto;
  color: #8d98aa;
  font-size: 11px;
}

.board-description {
  color: #647083;
  font-size: 11px;
  line-height: 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.board-menu-enter-active {
  transition:
    opacity 0.15s ease-out,
    transform 0.15s ease-out;
}

.board-menu-leave-active {
  transition:
    opacity 0.1s ease-in,
    transform 0.1s ease-in;
}

.board-menu-enter-from,
.board-menu-leave-to {
  opacity: 0;
  transform: translateY(6px) scale(0.98);
}

.composer-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.quick-actions {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 2px;
  color: #2f3743;
  font-size: 10px;
  white-space: nowrap;
}

.quick-action {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  color: inherit;
  font-size: inherit;

  &:hover {
    color: var(--blue);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
}

.plus {
  width: 20px;
  height: 20px;
  color: #111827;
  font-size: 18px;
  line-height: 18px;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
}

.send-button {
  margin-left: 24px;
  display: grid;
  justify-content: center;
  width: 23px;
  height: 23px;
  place-items: center;
  color: #ffffff;
  background: #1267ff;
  border-radius: 50%;
  box-shadow: 0 4px 12px rgb(18 103 255 / 28%);

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
}

@media (max-width: 1180px) {
  .composer {
    right: 95px;
  }
}
</style>
