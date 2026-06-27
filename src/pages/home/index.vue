<template>
  <view class="home-page" :style="homePageStyle" @click="handlePageClick">
    <view class="mobile-nav">
      <view class="mobile-nav-content">
        <button
          class="mobile-menu-button"
          :class="{ open: isMobileSidebarOpen }"
          @click="toggleMobileSidebar"
        >
          <text></text>
          <text></text>
          <text></text>
        </button>
        <text class="mobile-nav-title">车肆</text>
      </view>
    </view>
    <view
      class="mobile-sidebar-mask"
      :class="{ open: isMobileSidebarOpen }"
      @click="closeMobileSidebar"
    ></view>
    <view class="workspace">
      <view
        class="sidebar"
        :class="{
          collapsed: isSidebarCollapsed,
          'mobile-open': isMobileSidebarOpen,
          'PC-layout': !isMobileLayout,
        }"
      >
        <view v-if="!isSidebarCollapsed" class="sidebar-content">
          <view class="sidebar-header">
            <view class="brand-mark">
              <image class="brand-logo" :src="brandLogoUrl" mode="aspectFit" />
            </view>
            <view v-if="companyName" class="company-short-name">
              {{ shortName }}
            </view>
          </view>
          <button class="new-chat" :disabled="isBusy" @click="createSession">
            <image
              class="button-icon"
              src="/static/svg/edit-icon.svg"
              mode="aspectFit"
            />
            <text>创建新对话</text>
          </button>

          <scroll-view class="chat-list" scroll-y>
            <view
              v-for="group in sessionChatGroups"
              :key="group.label"
              class="chat-section"
            >
              <text class="date-label">{{ group.label }}</text>
              <view
                v-for="chat in group.items"
                :key="chat.id"
                class="chat-item"
                :class="{ active: chat.active }"
                role="button"
                tabindex="0"
                @click="selectSession(chat.id)"
              >
                <text class="chat-title">{{ chat.title }}</text>
                <!-- <button class="chat-more" :aria-label="`${chat.title}更多操作`" @click.stop="handleSessionMore">
                    <text>...</text>
                  </button> -->
              </view>
            </view>

            <template v-if="!sessionChats.length">
              <template
                v-for="(item, index) in fallbackChats"
                :key="`${item.title}-${index}`"
              >
                <text v-if="item.date" class="date-label">{{ item.date }}</text>
                <view class="chat-item" :class="{ active: item.active }">
                  <text class="chat-title">{{ item.title }}</text>
                </view>
              </template>
            </template>
          </scroll-view>
        </view>

        <view v-if="!isSidebarCollapsed" class="company-menu-wrap">
          <view v-if="isCompanyMenuVisible" class="settings-card">
            <button
              v-for="item in settingItems"
              :key="item.label"
              class="setting-item"
              :class="{ active: item.action === 'settings' }"
              @click="handleSettingClick(item.action)"
            >
              <text class="setting-icon" :class="item.action"></text>
              <text>{{ item.label }}</text>
            </button>
          </view>

          <button class="company" @click="toggleCompanyMenu">
            <view class="avatar">
              <image
                v-if="settingsForm.avatarUrl"
                :src="settingsForm.avatarUrl"
                mode="aspectFill"
              />
              <text v-else>{{ avatarInitial }}</text>
            </view>
            <text class="company-name">{{ companyName }}</text>
          </button>
        </view>
      </view>

      <view class="main-panel">
        <button
          class="collapse-button"
          :class="{ collapsed: isSidebarCollapsed }"
          @click="toggleSidebar"
        >
          <image
            class="collapse-icon"
            src="/static/svg/expandIcon.svg"
            mode="aspectFit"
          />
        </button>

        <scroll-view
          v-if="showMessages"
          class="message-panel"
          scroll-y
          :scroll-top="messageScrollTop"
        >
          <view class="message-stream">
            <view v-if="chatStore.pendingFrameworkUpdate" class="pending-bar">
              框架修改待确认：请在会话中回复“确认”或“取消”。
            </view>

            <view
              v-for="message in chatStore.messages"
              :key="message.id"
              class="message-row"
              :class="{
                mine: message.role === 'USER',
                material:
                  message.role !== 'USER' && isMaterialMessageCard(message),
              }"
            >
              <view class="message-bubble">
                <template v-if="message.role === 'USER'">
                  <text
                    v-if="shouldShowUserMessageText(message)"
                    class="message-content"
                  >
                    {{ message.content }}
                  </text>
                  <view
                    v-if="getMessageUploadFile(message)"
                    class="upload-file-card"
                    :class="{ previewable: canPreviewUploadFile(message) }"
                    role="button"
                    tabindex="0"
                    @click="previewUploadFile(message)"
                  >
                    <view
                      class="upload-file-icon"
                      :class="getUploadFileKind(message)"
                    >
                      <text>{{ getUploadFileKindLabel(message) }}</text>
                    </view>
                    <view class="upload-file-main">
                      <text class="upload-file-label">上传资料</text>
                      <text class="upload-file-name">
                        {{ getMessageUploadFile(message)?.originalName }}
                      </text>
                      <text class="upload-file-meta">
                        {{ getUploadFileMetaText(message) }}
                      </text>
                    </view>
                    <text
                      v-if="canPreviewUploadFile(message)"
                      class="upload-file-action"
                    >
                      {{ getUploadFileActionText(message) }}
                    </text>
                  </view>
                  <text
                    v-if="getUploadFileError(message)"
                    class="upload-file-error"
                  >
                    {{ getUploadFileError(message) }}
                  </text>
                </template>
                <MessageMarkdown
                  v-else
                  class="message-content"
                  :content="message.content"
                  :animate="chatStore.shouldAnimateAssistantMessage(message)"
                  @animation-finished="
                    chatStore.finishAssistantMessageAnimation(message.id)
                  "
                  @typing-progress="scrollToBottom"
                />
                <MaterialMessageCard
                  v-if="
                    message.role !== 'USER' && isMaterialMessageCard(message)
                  "
                  :metadata="message.metadata"
                  :actions-disabled="isBusy"
                  @action="handleCardAction"
                />
                <StrategyMessageCard
                  v-else-if="message.role !== 'USER' && message.metadata?.card"
                  :metadata="message.metadata"
                  :actions-disabled="isBusy"
                  :show-next-actions="message.id === latestActionableMessageId"
                  @action="handleCardAction"
                />
                <!-- <text class="message-time">{{ formatTime(message.createdAt) }}</text> -->
              </view>
            </view>

            <view v-if="isBusy" class="assistant-loading">
              {{ assistantLoadingText }}
            </view>
          </view>
        </scroll-view>

        <view v-else class="hero">
          <view class="hero-title">
            <text>别再问我怎么搞钱了！</text>
            <text>用好车肆，先赚一个小目标！</text>
          </view>
          <view class="feature-grid">
            <button
              v-for="feature in visibleFeatures"
              :key="feature.title"
              class="feature-card"
              @click="handleFeatureSelect(feature)"
            >
              <view class="feature-visual">
                <image
                  class="feature-svg"
                  :src="feature.icon"
                  mode="aspectFit"
                />
              </view>
              <view class="feature-copy">
                <text class="feature-title">{{ feature.title }}</text>
                <text class="feature-description">{{
                  feature.description
                }}</text>
              </view>
            </button>
          </view>
        </view>

        <view
          v-if="isBoardMenuVisible"
          class="board-mention-menu"
          :style="boardMenuStyle"
          @click.stop
        >
          <text class="board-menu-title">选择看板</text>
          <scroll-view class="board-menu-list" scroll-y>
            <view
              v-for="board in filteredBoards"
              :key="board.id"
              class="board-option"
              role="button"
              tabindex="0"
              @click="selectBoard(board)"
              @keydown.enter="selectBoard(board)"
              @keydown.space.prevent="selectBoard(board)"
            >
              <text class="board-icon" @click.stop="selectBoard(board)">
                <image :src="board.icon" mode="aspectFit" />
              </text>
              <view class="board-copy" @click.stop="selectBoard(board)">
                <view class="board-name-row">
                  <text class="board-name">{{ board.name }}</text>
                  <text class="board-alias">@{{ board.mention }}</text>
                </view>
                <text class="board-description">{{ board.description }}</text>
              </view>
            </view>
          </scroll-view>
        </view>

        <view class="composer" @click.stop>
          <text v-if="strategyNotice" class="error-text">{{
            strategyNotice
          }}</text>
          <view
            v-if="hasPendingMaterialAttachments || materialAttachmentUploading"
            class="composer-attachments"
          >
            <scroll-view class="composer-attachment-scroll" scroll-x>
              <view class="composer-attachment-row">
                <view
                  v-for="attachment in pendingMaterialAttachments"
                  :key="attachment.id"
                  class="composer-attachment"
                >
                  <image
                    v-if="isPreviewableMaterialImage(attachment)"
                    class="composer-attachment-thumb"
                    :src="attachment.url"
                    mode="aspectFill"
                  />
                  <view v-else class="composer-attachment-file">
                    <text>{{
                      resolveMaterialTypeLabel(attachment.materialType)
                    }}</text>
                  </view>
                  <view class="composer-attachment-copy">
                    <text class="composer-attachment-name">{{
                      attachment.originalName
                    }}</text>
                    <text class="composer-attachment-meta">{{
                      formatUploadSize(attachment.size)
                    }}</text>
                  </view>
                  <button
                    class="composer-attachment-remove"
                    :disabled="isBusy"
                    @click.stop="removePendingMaterialAttachment(attachment.id)"
                  >
                    ×
                  </button>
                </view>
                <view
                  v-if="materialAttachmentUploading"
                  class="composer-attachment uploading"
                >
                  <view class="composer-attachment-file">
                    <text>上传</text>
                  </view>
                  <view class="composer-attachment-copy">
                    <text class="composer-attachment-name">正在上传素材</text>
                    <text class="composer-attachment-meta">请稍候</text>
                  </view>
                </view>
              </view>
            </scroll-view>
          </view>
          <view class="editor-wrap" :style="editorWrapStyle">
            <text
              v-if="!draft && !isComposing && !isEditorFocused"
              class="message-placeholder"
            >
              {{ composerPlaceholder }}
            </text>
            <textarea
              v-model="draft"
              class="message-input"
              :style="{ height: messageInputHeight }"
              :disabled="isBusy"
              :maxlength="-1"
              placeholder=""
              @blur="handleEditorBlur"
              @confirm="sendMessage"
              @focus="handleEditorFocus"
              @compositioncancel="handleEditorCompositionEnd"
              @compositionend="handleEditorCompositionEnd"
              @compositionstart="handleEditorCompositionStart"
              @input="handleDraftInput"
              @keydown="handleEditorKeydown"
              @tap="handleEditorPointerEnd"
            />
          </view>

          <view class="composer-footer">
            <scroll-view class="quick-actions" scroll-x>
              <view class="quick-action-row">
                <button
                  v-if="canUseUploadMaterial"
                  class="plus"
                  :disabled="isBusy || materialAttachmentUploading"
                  @click="chooseMaterial"
                >
                  <uni-icons type="plusempty" size="18" color="#111827" />
                </button>
                <view v-if="canUseUploadMaterial" class="tool-divider"></view>
                <button
                  v-if="activeComposerModeMeta"
                  class="mode-chip"
                  :disabled="isBusy || materialAttachmentUploading"
                  @click="cancelComposerMode"
                >
                  <text>{{ activeComposerModeMeta.label }}</text>
                  <text class="chip-close">×</text>
                </button>
                <button
                  v-for="action in visibleQuickActions"
                  :key="action.label"
                  class="quick-action"
                  :class="{ inert: action.interactive === false }"
                  :disabled="isBusy"
                  @click="handleQuickAction(action)"
                >
                  <text>{{ action.label }}</text>
                </button>
              </view>
            </scroll-view>
            <button
              class="send-button"
              :class="{
                'is-disabled':
                  isBusy ||
                  materialAttachmentUploading ||
                  !canSubmitComposerMessage,
              }"
              :disabled="
                isBusy ||
                materialAttachmentUploading ||
                !canSubmitComposerMessage
              "
              @click="sendMessage"
            >
              <uni-icons type="arrow-up" size="17" color="#ffffff" />
            </button>
            <button
              v-if="canUseUploadMaterial"
              class="mobile-attach-button"
              :disabled="isBusy || materialAttachmentUploading"
              @click="chooseMaterial"
            >
              <uni-icons type="plusempty" size="20" color="#303030" />
            </button>
          </view>
        </view>
      </view>
    </view>

    <StrategyReportModal
      :visible="isReportModalVisible"
      :loading="reportModalLoading"
      :report="activeReportResponse?.report ?? null"
      :next-actions="activeReportResponse?.nextActions ?? []"
      :actions-disabled="isBusy"
      @close="closeReportModal"
      @action="handleReportModalAction"
    />

    <view
      v-if="imagePreview.visible"
      class="file-preview-overlay"
      @click="closeImagePreview"
    >
      <view class="file-preview-panel" @click.stop>
        <view class="file-preview-header">
          <text class="file-preview-title">{{ imagePreview.name }}</text>
          <button
            class="file-preview-close"
            aria-label="关闭预览"
            @click="closeImagePreview"
          >
            ×
          </button>
        </view>
        <image
          class="file-preview-image"
          :src="imagePreview.url"
          mode="aspectFit"
        />
      </view>
    </view>

    <view
      v-if="isSettingsVisible"
      class="settings-overlay"
      @click="closeSettings"
    >
      <view class="settings-panel" @click.stop>
        <button
          class="settings-close settings-panel-close"
          @click="closeSettings"
        >
          <text class="close-icon"></text>
        </button>
        <view class="settings-nav">
          <button
            v-for="item in settingsMenuItems"
            :key="item.id"
            class="settings-nav-item"
            :class="{ active: activeSettingsMenu === item.id }"
            @click="setActiveSettingsMenu(item.id)"
          >
            <text class="settings-nav-icon" :class="item.id"></text>
            <text>{{ item.label }}</text>
          </button>
        </view>

        <scroll-view class="settings-content" scroll-y>
          <view class="settings-content-inner">
            <view class="settings-header">
              <text class="settings-title">{{ settingsPanelTitle }}</text>
              <text v-if="settingsLoading" class="settings-status"
                >正在同步账号信息</text
              >
            </view>
            <text v-if="settingsError" class="settings-error">{{
              settingsError
            }}</text>

            <template v-if="activeSettingsMenu === 'account'">
              <view class="settings-section account-summary">
                <view class="avatar-preview">
                  <image
                    v-if="settingsForm.avatarUrl"
                    :src="settingsForm.avatarUrl"
                    mode="aspectFill"
                  />
                  <text v-else>{{ avatarInitial }}</text>
                </view>
                <view class="summary-text">
                  <text class="summary-name">{{
                    settingsForm.nickname || displayName
                  }}</text>
                  <text class="summary-id">{{
                    userAccountId || "暂无账号ID"
                  }}</text>
                </view>
                <view class="avatar-actions">
                  <button
                    class="secondary-button"
                    :disabled="avatarUploading || avatarResetting"
                    @click="chooseAvatar"
                  >
                    {{ avatarUploading ? "上传中" : "更换头像" }}
                  </button>
                  <button
                    class="ghost-button"
                    :disabled="
                      !settingsForm.avatarUrl ||
                      avatarUploading ||
                      avatarResetting
                    "
                    @click="resetAvatar"
                  >
                    {{ avatarResetting ? "重置中" : "重置头像" }}
                  </button>
                </view>
              </view>

              <view class="settings-section">
                <view class="form-row">
                  <text>昵称</text>
                  <input
                    v-model.trim="settingsForm.nickname"
                    placeholder="请输入昵称"
                  />
                </view>
                <view class="form-row">
                  <text>手机号码</text>
                  <input
                    v-model.trim="settingsForm.phone"
                    placeholder="请输入手机号码"
                    type="number"
                  />
                </view>
              </view>

              <view class="settings-section">
                <text class="section-title">企业信息</text>
                <view class="readonly-row">
                  <text>企业名称</text>
                  <text>{{ tenantName }}</text>
                </view>
                <view class="readonly-row">
                  <text>姓名</text>
                  <text>{{ displayName }}</text>
                </view>
                <view class="readonly-row">
                  <text>角色</text>
                  <text>{{ roleText }}</text>
                </view>
                <view class="readonly-row">
                  <text>所属组织</text>
                  <text>{{ organizationText }}</text>
                </view>
              </view>

              <view class="settings-actions">
                <button
                  class="primary-button"
                  :disabled="
                    settingsSaving || avatarUploading || avatarResetting
                  "
                  @click="saveSettings"
                >
                  {{ settingsSaving ? "保存中" : "保存设置" }}
                </button>
              </view>
            </template>

            <template v-else>
              <view class="settings-section password-settings-section">
                <view class="form-row">
                  <text>当前密码</text>
                  <input
                    v-model="settingsForm.currentPassword"
                    password
                    placeholder="请输入当前密码"
                  />
                </view>
                <view class="form-row">
                  <text>新密码</text>
                  <input
                    v-model="settingsForm.newPassword"
                    password
                    placeholder="至少 6 位"
                  />
                </view>
                <view class="form-row">
                  <text>确认新密码</text>
                  <input
                    v-model="settingsForm.confirmPassword"
                    password
                    placeholder="再次输入新密码"
                  />
                </view>
              </view>

              <view class="settings-actions">
                <button class="ghost-button" @click="resetPasswordForm">
                  重置
                </button>
                <button
                  class="primary-button"
                  :disabled="settingsSaving"
                  @click="savePasswordSettings"
                >
                  {{ settingsSaving ? "保存中" : "修改密码" }}
                </button>
              </view>
            </template>
          </view>
        </scroll-view>
      </view>
    </view>

    <view
      v-if="isFeedbackVisible"
      class="settings-overlay feedback-overlay"
      @click="closeFeedback"
    >
      <view class="feedback-panel" @click.stop>
        <view class="feedback-header">
          <view class="feedback-title-copy">
            <text class="feedback-title">问题反馈</text>
            <text class="feedback-subtitle">提交后将生成调度中心工单</text>
          </view>
          <button
            class="settings-close feedback-close"
            :disabled="feedbackSubmitting"
            @click="closeFeedback"
          >
            <text class="close-icon"></text>
          </button>
        </view>

        <view class="feedback-body">
          <textarea
            v-model="feedbackForm.description"
            class="feedback-textarea"
            :disabled="feedbackSubmitting"
            :maxlength="2000"
            placeholder="请描述你遇到的问题、期望结果或复现步骤"
          />
          <text class="feedback-counter">
            {{ feedbackForm.description.length }}/2000
          </text>

          <view class="feedback-image-section">
            <view class="feedback-image-header">
              <text>图片附件</text>
              <text
                >{{ feedbackImages.length }}/{{
                  FEEDBACK_MAX_IMAGE_COUNT
                }}</text
              >
            </view>
            <view class="feedback-image-list">
              <view
                v-for="image in feedbackImages"
                :key="image.id"
                class="feedback-image-item"
              >
                <image :src="image.url" mode="aspectFill" />
                <button
                  class="feedback-image-remove"
                  :disabled="feedbackSubmitting"
                  @click="removeFeedbackImage(image.id)"
                >
                  ×
                </button>
              </view>
              <button
                v-if="feedbackImages.length < FEEDBACK_MAX_IMAGE_COUNT"
                class="feedback-image-add"
                :disabled="feedbackSubmitting"
                @click="chooseFeedbackImages"
              >
                <text class="feedback-image-add-icon">+</text>
                <text>上传图片</text>
              </button>
            </view>
          </view>
          <text v-if="feedbackError" class="settings-error">{{
            feedbackError
          }}</text>
        </view>

        <view class="settings-actions feedback-actions">
          <button
            class="ghost-button"
            :disabled="feedbackSubmitting"
            @click="closeFeedback"
          >
            取消
          </button>
          <button
            class="primary-button"
            :disabled="feedbackSubmitting || !feedbackForm.description.trim()"
            @click="submitFeedback"
          >
            {{ feedbackSubmitting ? "提交中" : "提交反馈" }}
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad, onUnload } from "@dcloudio/uni-app";
import { computed, nextTick, reactive, ref, watch } from "vue";
import {
  fetchBlob,
  getUserErrorMessage,
  request,
  upload,
  uploadBrowserFile,
  uploadBrowserFiles,
  uploadFiles,
} from "@/services/api";
import { useAuthStore } from "@/stores/auth";
import { useStrategyChatStore } from "@/stores/strategyChat";
import type {
  CommonUploadFilesResponse,
  CommonUploadedFile,
  MaterialChatAttachment,
  MaterialType,
} from "@/types/material";
import type {
  AgentMessage,
  LoginResponse,
  StrategyChatSessionSummary,
  StrategyFileAsset,
  StrategyReportResponse,
} from "@/types/strategy";
import MaterialMessageCard from "./components/MaterialMessageCard.vue";
import MessageMarkdown from "./components/MessageMarkdown.vue";
import StrategyMessageCard from "./components/StrategyMessageCard.vue";
import StrategyReportModal from "./components/StrategyReportModal.vue";

type BoardType =
  | "brand-strategy"
  | "key-metrics"
  | "marketing-operations"
  | "marketing-calendar"
  | "market-feedback"
  | "ecological-partner";

type Feature = {
  title: string;
  description: string;
  icon: string;
  action?: "strategy-chat";
  boardType?: BoardType;
};

type BoardOption = {
  id: BoardType;
  name: string;
  mention: string;
  description: string;
  icon: string;
  requiredAll: string[];
  searchText: string;
};

type QuickActionBase = {
  label: string;
  interactive?: boolean;
  requiredAll?: string[];
  requiredAny?: string[];
};

type QuickAction =
  | (QuickActionBase & { type: "board" })
  | (QuickActionBase & { type: "upload" })
  | (QuickActionBase & { type: "mode"; mode: ComposerModeId })
  | (QuickActionBase & {
      type: "prompt";
      prompt: string;
      strategy?: boolean;
    });

type ComposerModeId = "strategy" | "material";

type ComposerMode = {
  id: ComposerModeId;
  label: string;
  placeholder: string;
};

type SessionChatItem = {
  id: string;
  title: string;
  preview: string;
  active: boolean;
};

type SessionChatGroup = {
  label: string;
  items: SessionChatItem[];
};

type PickedFile = {
  path?: string;
  tempFilePath?: string;
  name?: string;
  type?: string;
};

type BoardTrigger = {
  start: number;
  end: number;
  query: string;
};

type RectLike = {
  left: number;
  top: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
};

type AuthUser = LoginResponse["user"];
type SettingsMenuId = "account" | "password";
type PreviewableStrategyFile = Pick<
  StrategyFileAsset,
  "id" | "originalName" | "mimeType" | "previewUrl" | "status"
> & {
  size?: number | null;
  metadata?: Record<string, unknown> | null;
};
type MeContext = {
  user?: AuthUser;
  tenant?: {
    id?: string;
    name?: string;
    logoUrl?: string | null;
  } | null;
  roles?: Array<{
    id?: string;
    name?: string;
  }>;
  permissions?: string[];
};

type LocalSettings = {
  avatarUrl: string;
  nickname: string;
  phone: string;
};

type MeAvatarUploadResponse = {
  avatarUrl: string;
  context?: MeContext;
  storageProvider?: string;
  storageKey?: string;
};

type MeAvatarClearResponse = {
  avatarUrl: null;
  context?: MeContext;
};

type FeedbackTicketResponse = {
  id: string;
  ticketNo?: string;
  status?: string;
};

type FeedbackImage = {
  id: string;
  url: string;
  filePath: string;
  fileName: string;
  browserFile: Blob | null;
};

type PendingMaterialAttachment = CommonUploadedFile & {
  id: string;
  materialType: MaterialType;
};

const LOCAL_SETTINGS_KEY = "vehicle_marketing_client_account_settings";
const DEFAULT_BRAND_LOGO = "/static/svg/logoIcon.svg";
const STRATEGY_AGENT_CODE = "strategy_agent";
const MATERIAL_AGENT_CODE = "material_agent";
const BUSY_ELAPSED_VISIBLE_THRESHOLD_SECONDS = 10;
const COMPOSER_INPUT_MIN_HEIGHT = 32;
const COMPOSER_INPUT_DESKTOP_MAX_HEIGHT = 132;
const COMPOSER_INPUT_MOBILE_MAX_HEIGHT = 112;
const COMPOSER_INPUT_DESKTOP_LINE_HEIGHT = 22;
const COMPOSER_INPUT_MOBILE_LINE_HEIGHT = 24;
const SESSION_DAY_MS = 24 * 60 * 60 * 1000;
const FEEDBACK_MAX_IMAGE_COUNT = 6;
const MATERIAL_DOCUMENT_EXTENSIONS = [
  "pdf",
  "txt",
  "md",
  "markdown",
  "csv",
  "json",
];
const MATERIAL_AGENT_DOCUMENT_EXTENSIONS = [
  "docx",
  "doc",
  "xlsx",
  "xls",
  "csv",
  "pptx",
  "ppt",
  "odt",
  "ods",
  "odp",
  "epub",
];
const MATERIAL_AGENT_IMAGE_EXTENSIONS = [
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
];
const MATERIAL_AGENT_VIDEO_EXTENSIONS = ["mp4", "webm", "ogg", "mov", "m4v"];
const MATERIAL_AGENT_AUDIO_EXTENSIONS = [
  "mp3",
  "wav",
  "ogg",
  "m4a",
  "flac",
  "aac",
];
const MATERIAL_AGENT_SUPPORTED_EXTENSIONS = Array.from(
  new Set([
    ...MATERIAL_AGENT_IMAGE_EXTENSIONS,
    ...MATERIAL_AGENT_DOCUMENT_EXTENSIONS,
    ...MATERIAL_AGENT_VIDEO_EXTENSIONS,
    ...MATERIAL_AGENT_AUDIO_EXTENSIONS,
  ]),
);
const MATERIAL_AGENT_SUPPORTED_EXTENSION_SET = new Set(
  MATERIAL_AGENT_SUPPORTED_EXTENSIONS,
);
const MATERIAL_ATTACHMENT_MAX_COUNT = 20;
const MATERIAL_SUPPORTED_EXTENSIONS = [
  ...MATERIAL_DOCUMENT_EXTENSIONS,
  "jpg",
  "jpeg",
  "png",
  "webp",
  "bmp",
  "gif",
];
const MATERIAL_IMAGE_EXTENSION_PATTERN =
  /\.(?:jpe?g|png|webp|bmp|gif|svg|ico|avif|tiff)$/i;
const STRATEGY_UPLOAD_ALLOWED_STATUSES = new Set([
  "collecting_info",
  "form_draft_generated",
  "rediagnosing",
  "form_confirmed",
  "framework_draft_generated",
  "framework_refining",
  "framework_confirmed",
  "completed",
]);
const MATERIAL_MANAGE_PERMISSIONS = [
  "agent.material.use",
  "skill.material.manage.use",
] as const;

const authStore = useAuthStore();
const chatStore = useStrategyChatStore();
const pageLoading = ref(false);
const isSidebarCollapsed = ref(false);
const isCompanyMenuVisible = ref(false);
const isSettingsVisible = ref(false);
const isFeedbackVisible = ref(false);
const isBoardMenuVisible = ref(false);
const isMobileSidebarOpen = ref(false);
const isReportModalVisible = ref(false);
const reportModalLoading = ref(false);
const activeComposerMode = ref<ComposerModeId | null>(null);
const activeReportResponse = ref<StrategyReportResponse | null>(null);
const mobileStatusBarHeight = ref(0);
const mobileNavHeight = ref(56);
const mobileNavContentHeight = ref(44);
const mobileNavTopOffset = ref(0);
const mobileRightSafeWidth = ref(58);
const mobileCapsuleSafeRight = ref(14);
const boardMenuQuery = ref("");
const boardMenuTrigger = ref<BoardTrigger | null>(null);
const boardMenuStyle = ref("left:16px;top:96px;width:320px;");
const editorCursor = ref(0);
const boardMenuCloseTimer = ref<ReturnType<typeof setTimeout> | null>(null);
const draft = ref("");
const isComposing = ref(false);
const isEditorFocused = ref(false);
const messageInputHeightValue = ref(COMPOSER_INPUT_MIN_HEIGHT);
const messageScrollTop = ref(0);
const activeSettingsMenu = ref<SettingsMenuId>("account");
const settingsLoading = ref(false);
const settingsSaving = ref(false);
const settingsError = ref("");
const feedbackSubmitting = ref(false);
const feedbackError = ref("");
const avatarUploading = ref(false);
const avatarResetting = ref(false);
const previewingFileId = ref("");
const filePreviewErrors = reactive<Record<string, string>>({});
const imagePreview = reactive({
  visible: false,
  url: "",
  name: "",
});
const previewObjectUrls = new Set<string>();
const pendingAvatarFilePath = ref("");
const pendingAvatarFileName = ref("");
const pendingAvatarBrowserFile = ref<Blob | null>(null);
const busyStartedAt = ref<number | null>(null);
const busyElapsedSeconds = ref(0);
const meContext = ref<MeContext | null>(null);
let busyTimer: ReturnType<typeof setInterval> | null = null;
let avatarUploadPromise: Promise<string> | null = null;
let meFetchVersion = 0;
let avatarEditVersion = 0;
const settingsForm = reactive({
  avatarUrl: "",
  nickname: "",
  phone: "",
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
});
const feedbackForm = reactive({
  description: "",
});
const feedbackImages = ref<FeedbackImage[]>([]);
const pendingMaterialAttachments = ref<PendingMaterialAttachment[]>([]);
const materialAttachmentUploading = ref(false);
const isMobileLayout = ref(false);
const messageInputHeight = computed(() => `${messageInputHeightValue.value}px`);
const editorWrapStyle = computed(() => {
  const verticalPadding = isMobileLayout.value ? 24 : 0;

  return {
    height: `${messageInputHeightValue.value + verticalPadding}px`,
  };
});

function updateMobileLayout(width = uni.getSystemInfoSync().windowWidth) {
  isMobileLayout.value = width <= 760;
}

function getComposerInputMaxHeight() {
  return isMobileLayout.value
    ? COMPOSER_INPUT_MOBILE_MAX_HEIGHT
    : COMPOSER_INPUT_DESKTOP_MAX_HEIGHT;
}

function setComposerInputHeight(height: number) {
  messageInputHeightValue.value = Math.round(
    Math.min(
      getComposerInputMaxHeight(),
      Math.max(COMPOSER_INPUT_MIN_HEIGHT, height),
    ),
  );
}

function countComposerColumns(text: string) {
  return Array.from(text).reduce((total, char) => {
    if (char === "\t") {
      return total + 4;
    }

    if (char === " ") {
      return total + 0.5;
    }

    return total + (/[\u2E80-\u9FFF\uF900-\uFAFF]/.test(char) ? 2 : 1);
  }, 0);
}

function estimateComposerInputHeight(value: string) {
  const maxHeight = getComposerInputMaxHeight();
  const lineHeight = isMobileLayout.value
    ? COMPOSER_INPUT_MOBILE_LINE_HEIGHT
    : COMPOSER_INPUT_DESKTOP_LINE_HEIGHT;
  const wrapColumns = isMobileLayout.value ? 24 : 76;
  const lines = (value ? value.split(/\r\n|\r|\n/) : [""]).reduce(
    (total, line) => {
      return (
        total + Math.max(1, Math.ceil(countComposerColumns(line) / wrapColumns))
      );
    },
    0,
  );

  return Math.min(
    maxHeight,
    Math.max(COMPOSER_INPUT_MIN_HEIGHT, lines * lineHeight + 2),
  );
}

function updateComposerInputHeight() {
  const estimatedHeight = estimateComposerInputHeight(draft.value);
  setComposerInputHeight(estimatedHeight);

  // #ifdef H5
  nextTick(() => {
    const textarea = document.querySelector<HTMLTextAreaElement>(
      "textarea.message-input, .message-input textarea",
    );
    if (!textarea) {
      return;
    }

    const maxHeight = getComposerInputMaxHeight();
    textarea.style.setProperty("height", "auto", "important");
    textarea.style.setProperty(
      "min-height",
      `${COMPOSER_INPUT_MIN_HEIGHT}px`,
      "important",
    );
    textarea.style.setProperty("max-height", `${maxHeight}px`, "important");

    if (!draft.value) {
      setComposerInputHeight(COMPOSER_INPUT_MIN_HEIGHT);
      textarea.style.setProperty(
        "height",
        `${COMPOSER_INPUT_MIN_HEIGHT}px`,
        "important",
      );
      textarea.style.setProperty("overflow-y", "hidden", "important");
      return;
    }

    const scrollHeight = textarea.scrollHeight || estimatedHeight;
    const height = Math.min(
      maxHeight,
      Math.max(COMPOSER_INPUT_MIN_HEIGHT, scrollHeight),
    );

    setComposerInputHeight(height);
    textarea.style.setProperty(
      "height",
      `${messageInputHeightValue.value}px`,
      "important",
    );
    textarea.style.setProperty(
      "overflow-y",
      scrollHeight > maxHeight ? "auto" : "hidden",
      "important",
    );
  });
  // #endif
}

const iconMap = {
  brandStrategy: "/static/svg/brand-strategy.svg",
  keyMetrics: "/static/svg/key-metrics.svg",
  marketingOperations: "/static/svg/marketing-operations.svg",
  marketingCalendar: "/static/svg/marketing-calendar.svg",
  marketFeedback: "/static/svg/market-feedback.svg",
  ecologicalPartner: "/static/svg/ecological-partner.svg",
};

const STRATEGY_DIAGNOSIS_SKILL_PERMISSIONS = [
  "agent.strategy.use",
  "skill.strategy.diagnosis.use",
] as const;
const STRATEGY_UPLOAD_MATERIAL_SKILL_PERMISSIONS = [
  "agent.strategy.use",
  "skill.strategy.upload_material.use",
] as const;
const STRATEGY_DECOMPOSE_SKILL_PERMISSIONS = [
  "agent.strategy.use",
  "skill.strategy.decompose.use",
] as const;
const STRATEGY_REPORT_GENERATE_SKILL_PERMISSIONS = [
  "agent.strategy.use",
  "skill.strategy.report_generate.use",
] as const;

const DASHBOARD_PERMISSION_BY_BOARD: Record<BoardType, string> = {
  "brand-strategy": "dashboard.brand_strategy.view",
  "key-metrics": "dashboard.core_metrics.view",
  "marketing-operations": "dashboard.marketing_operation.view",
  "marketing-calendar": "dashboard.marketing_calendar.view",
  "market-feedback": "dashboard.market_feedback.view",
  "ecological-partner": "dashboard.ecosystem_partners.view",
};

const features: Feature[] = [
  {
    title: "品牌战略",
    description: "锚定方向，塑造品牌心智",
    icon: iconMap.brandStrategy,
    boardType: "brand-strategy",
  },
  {
    title: "核心指标",
    description: "数据驱动业务增长",
    icon: iconMap.keyMetrics,
    boardType: "key-metrics",
  },
  {
    title: "营销运营",
    description: "全链路营销提效增长",
    icon: iconMap.marketingOperations,
    boardType: "marketing-operations",
  },
  {
    title: "营销日历",
    description: "精准把控营销节点",
    icon: iconMap.marketingCalendar,
    boardType: "marketing-calendar",
  },
  {
    title: "市场反馈",
    description: "倾听用户优化策略",
    icon: iconMap.marketFeedback,
    boardType: "market-feedback",
  },
  {
    title: "生态伙伴",
    description: "携手同行共建生态",
    icon: iconMap.ecologicalPartner,
    boardType: "ecological-partner",
  },
];

const fallbackChats: Array<{
  date?: string;
  title: string;
  active?: boolean;
}> = [
  // { date: "最近会话", title: "新的聊天", active: true },
];

const quickActions: QuickAction[] = [
  {
    label: "@ 看板",
    type: "board",
    requiredAny: Object.values(DASHBOARD_PERMISSION_BY_BOARD),
  },
  {
    label: "/ 战略诊断",
    type: "prompt",
    prompt: "开始战略诊断",
    strategy: true,
    requiredAll: [...STRATEGY_DIAGNOSIS_SKILL_PERMISSIONS],
  },
  {
    label: "/ 素材入库",
    type: "mode",
    mode: "material",
    requiredAll: [...MATERIAL_MANAGE_PERMISSIONS],
  },
  // {
  //   label: "/ 上传资料",
  //   type: "upload",
  //   requiredAll: [...STRATEGY_UPLOAD_MATERIAL_SKILL_PERMISSIONS],
  // },
  // {
  //   label: "/ 战略拆解",
  //   type: "prompt",
  //   prompt: "查看当前19点战略",
  //   strategy: true,
  //   requiredAll: [...STRATEGY_DECOMPOSE_SKILL_PERMISSIONS],
  // },
  // {
  //   label: "/ 生成报告",
  //   type: "prompt",
  //   prompt: "生成全部7份战略报告",
  //   strategy: true,
  //   requiredAll: [...STRATEGY_REPORT_GENERATE_SKILL_PERMISSIONS],
  // },
  // {
  //   label: "/ 打开看板",
  //   type: "prompt",
  //   prompt: "打开品牌战略看板",
  //   strategy: true,
  //   requiredAll: [
  //     "agent.strategy.use",
  //     DASHBOARD_PERMISSION_BY_BOARD["brand-strategy"],
  //   ],
  // },
];

const composerModes: Record<ComposerModeId, ComposerMode> = {
  strategy: {
    id: "strategy",
    label: "战略诊断",
    placeholder: "描述企业现状或你想诊断的战略方向",
  },
  material: {
    id: "material",
    label: "素材入库",
    placeholder: "上传素材并补充描述，或检索已入库素材",
  },
};

const boardOptions: BoardOption[] = (
  [
    {
      id: "brand-strategy",
      name: "品牌战略看板",
      mention: "品牌战略",
      description: "锚定方向，塑造品牌心智",
      icon: iconMap.brandStrategy,
      requiredAll: [
        "agent.strategy.use",
        DASHBOARD_PERMISSION_BY_BOARD["brand-strategy"],
      ],
    },
    {
      id: "key-metrics",
      name: "核心指标看板",
      mention: "核心指标",
      description: "数据驱动业务增长",
      icon: iconMap.keyMetrics,
      requiredAll: [DASHBOARD_PERMISSION_BY_BOARD["key-metrics"]],
    },
    {
      id: "marketing-operations",
      name: "营销运营看板",
      mention: "营销运营",
      description: "全链路营销提效增长",
      icon: iconMap.marketingOperations,
      requiredAll: [DASHBOARD_PERMISSION_BY_BOARD["marketing-operations"]],
    },
    {
      id: "marketing-calendar",
      name: "营销日历看板",
      mention: "营销日历",
      description: "精准把控营销节点",
      icon: iconMap.marketingCalendar,
      requiredAll: [DASHBOARD_PERMISSION_BY_BOARD["marketing-calendar"]],
    },
    {
      id: "market-feedback",
      name: "市场反馈看板",
      mention: "市场反馈",
      description: "倾听用户优化策略",
      icon: iconMap.marketFeedback,
      requiredAll: [DASHBOARD_PERMISSION_BY_BOARD["market-feedback"]],
    },
    {
      id: "ecological-partner",
      name: "生态伙伴看板",
      mention: "生态伙伴",
      description: "携手同行共建生态",
      icon: iconMap.ecologicalPartner,
      requiredAll: [DASHBOARD_PERMISSION_BY_BOARD["ecological-partner"]],
    },
  ] satisfies Array<Omit<BoardOption, "searchText">>
).map((board) => ({
  ...board,
  searchText: [board.id, board.name, board.mention, board.description]
    .join(" ")
    .toLowerCase()
    .replace(/[\s-]+/g, ""),
}));

const settingItems = [
  { label: "设置", action: "settings" },
  { label: "问题反馈", action: "feedback" },
  { label: "退出登录", action: "logout" },
] as const;
const settingsMenuItems: Array<{
  id: SettingsMenuId;
  label: string;
}> = [
  { id: "account", label: "账号设置" },
  { id: "password", label: "修改密码" },
];

const actionPrompts: Record<string, string> = {
  start_diagnosis: "开始战略诊断",
  provide_info: "我想补充企业信息",
  view_files: "查看当前资料",
  view_form: "查看当前19点战略进展",
  generate_form: "整理当前19点战略",
  confirm_form: "确认",
  generate_framework: "查看当前19点战略",
  refine_framework: "请基于当前19点战略整理需要继续确认的问题",
  confirm_framework: "确认",
  generate_reports: "生成全部7份战略报告",
  wait_reports: "查看当前诊断进度",
  sync_reports: "同步报告",
  view_enterprise_diagnosis_report: "查看企业战略诊断报告",
  view_enterprise_solution_report: "查看企业战略方案报告",
  view_beidou_declaration: "查看北斗宣言",
  view_strategy_positioning_report: "查看战略定位报告",
  view_advantages_barriers_report: "查看优势与壁垒报告",
  view_business_model_panorama: "查看商业模式全景图",
  view_brand_experience_blueprint: "查看品牌与体验蓝图",
  web_search_evidence: "联网搜索企业公开资料并整理战略诊断证据",
  apply_search_to_form: "把最近一次联网搜索结果补充到当前19点战略",
  apply_search_to_framework: "把最近一次联网搜索结果补充到当前19点战略",
  rediagnose: "重新诊断",
  confirm_framework_update: "确认修改",
  cancel_framework_update: "取消修改",
  continue_refine_framework: "继续完善19点战略",
  answer_refinement_questions: "我来回答追问问题",
  update_framework: "提交框架修改",
  check_status: "查看当前诊断进度",
};

const reportActionTypes: Record<string, string> = {
  view_enterprise_diagnosis_report: "enterprise_diagnosis",
  view_enterprise_solution_report: "enterprise_solution",
  view_beidou_declaration: "beidou_declaration",
  view_strategy_positioning_report: "strategy_positioning",
  view_advantages_barriers_report: "advantages_barriers",
  view_business_model_panorama: "business_model_panorama",
  view_brand_experience_blueprint: "brand_experience_blueprint",
};

const isBusy = computed(
  () =>
    pageLoading.value ||
    chatStore.loading ||
    chatStore.uploading ||
    reportModalLoading.value,
);
const assistantLoadingText = computed(() => {
  const text = chatStore.uploading
    ? isMaterialComposerMode.value
      ? "正在上传素材"
      : "正在上传并解析资料"
    : reportModalLoading.value
      ? "正在加载报告"
      : "正在处理";

  return busyElapsedSeconds.value >= BUSY_ELAPSED_VISIBLE_THRESHOLD_SECONDS
    ? `${text}，已耗时 ${busyElapsedSeconds.value} 秒`
    : text;
});
const showMessages = computed(() => chatStore.messages.length > 0);
const hasPendingMaterialAttachments = computed(
  () => pendingMaterialAttachments.value.length > 0,
);
const canSubmitComposerMessage = computed(
  () => Boolean(draft.value.trim()) || hasPendingMaterialAttachments.value,
);
const latestActionableMessageId = computed(() => {
  for (let index = chatStore.messages.length - 1; index >= 0; index -= 1) {
    const message = chatStore.messages[index];

    if (message.role === "ASSISTANT" && message.metadata?.card) {
      return message.id;
    }
  }

  return "";
});
const strategyNotice = computed(
  () => chatStore.error || chatStore.unavailableReason,
);
const settingsPanelTitle = computed(() =>
  activeSettingsMenu.value === "password" ? "修改密码" : "账户",
);
const settingsUser = computed(() => meContext.value?.user ?? authStore.user);
const companyName = computed(() => {
  const user = settingsUser.value;

  return (
    user?.nickname ||
    user?.name ||
    user?.loginName ||
    user?.email ||
    user?.phone ||
    user?.tenantId ||
    "车肆企业空间"
  );
});
const brandLogoUrl = computed(() => {
  const logoUrl = meContext.value?.tenant?.logoUrl?.trim();

  return logoUrl || DEFAULT_BRAND_LOGO;
});
const displayName = computed(
  () =>
    settingsUser.value?.name ||
    settingsUser.value?.loginName ||
    settingsUser.value?.email ||
    "未命名用户",
);
const userAccountId = computed(
  () => settingsUser.value?.sub || authStore.user?.sub || "",
);
const avatarInitial = computed(() => {
  const source = settingsForm.nickname || displayName.value || "车";
  return source.slice(0, 1).toUpperCase();
});
const tenantName = computed(
  () =>
    meContext.value?.tenant?.name || authStore.user?.tenantId || "暂未绑定企业",
);
const shortName = computed(() => {
  const name = settingsUser.value?.organizationShortName;
  return name || "";
});
const roleText = computed(() => {
  const roleNames = (meContext.value?.roles ?? [])
    .map((role) => role.name)
    .filter((name): name is string => Boolean(name));

  if (settingsUser.value?.isTenantSuperAdmin) {
    return "企业超级管理员";
  }

  const visibleRoleNames = roleNames.filter(
    (name) => name !== "企业超级管理员",
  );

  if (visibleRoleNames.length > 0) {
    return Array.from(new Set(visibleRoleNames)).join("、");
  }

  if (settingsUser.value?.role === "ADMIN") {
    return "系统管理员";
  }

  return "普通成员";
});
const organizationText = computed(
  () =>
    settingsUser.value?.organizationName ||
    settingsUser.value?.departmentName ||
    "暂未设置",
);
const currentPermissionCodes = computed(() => {
  const permissions =
    meContext.value?.permissions ?? authStore.user?.permissions ?? [];

  return new Set(permissions);
});
function hasPermission(code: string) {
  return (
    Boolean(authStore.user?.isBootstrap) ||
    Boolean(settingsUser.value?.isTenantSuperAdmin) ||
    settingsUser.value?.role === "ADMIN" ||
    currentPermissionCodes.value.has("*") ||
    currentPermissionCodes.value.has(code)
  );
}
function hasAllPermissions(codes: readonly string[] = []) {
  return codes.every((code) => hasPermission(code));
}
function hasAnyPermission(codes: readonly string[] = []) {
  return codes.length === 0 || codes.some((code) => hasPermission(code));
}
function canUseQuickAction(action: QuickAction) {
  return (
    hasAllPermissions(action.requiredAll ?? []) &&
    hasAnyPermission(action.requiredAny ?? [])
  );
}
function canAccessBoard(type: BoardType) {
  const board = boardOptions.find((item) => item.id === type);

  return board ? hasAllPermissions(board.requiredAll) : false;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return asRecord(parsed);
    } catch {
      return {};
    }
  }

  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function getString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function hasOwnValue(source: Record<string, unknown>, key: string) {
  return Object.prototype.hasOwnProperty.call(source, key);
}

function getStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map(String)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/[,，、\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function hasRecordData(value: Record<string, unknown>) {
  return Object.keys(value).length > 0;
}

function hasMaterialCardData(card: Record<string, unknown>) {
  const data = asRecord(card.data);
  const materialTable = asRecord(card.materialTable || data.materialTable);
  const stats = asRecord(card.stats || data.stats);

  return (
    (Array.isArray(card.drafts) && card.drafts.length > 0) ||
    (Array.isArray(data.drafts) && data.drafts.length > 0) ||
    Boolean(card.draft || data.draft) ||
    (Array.isArray(card.assets) && card.assets.length > 0) ||
    (Array.isArray(data.assets) && data.assets.length > 0) ||
    Boolean(card.asset || data.asset) ||
    hasRecordData(materialTable) ||
    hasRecordData(stats)
  );
}

function isMaterialMessageCard(message: AgentMessage) {
  const metadata = asRecord(message.metadata);
  const card = asRecord(metadata.card);
  const type =
    getString(card.type) ||
    getString(asRecord(card.ui).type) ||
    getString(metadata.type);

  return type.startsWith("material_") || hasMaterialCardData(card);
}

function getNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : null;
  }

  return null;
}

function extractUploadedFileName(content: string) {
  return (
    /^(?:上传资料|已上传资料)[:：]\s*(.+?)\s*$/.exec(content)?.[1]?.trim() || ""
  );
}

function toPreviewableStrategyFile(
  source: Record<string, unknown>,
  fallbackName = "",
): PreviewableStrategyFile | null {
  const id = getString(source.id) || getString(source.fileId);
  const originalName =
    getString(source.originalName) ||
    getString(source.name) ||
    getString(source.fileName) ||
    fallbackName;

  if (!id || !originalName) {
    return null;
  }

  return {
    id,
    originalName,
    mimeType:
      getString(source.mimeType) || getString(source.contentType) || null,
    size: getNumber(source.size),
    status: getString(source.status) || "uploaded",
    metadata: asRecord(source.metadata),
    previewUrl:
      getString(source.previewUrl) ||
      getString(source.url) ||
      `/strategy/files/${id}/preview`,
  };
}

function getMessageUploadFile(
  message: AgentMessage,
): PreviewableStrategyFile | null {
  if (message.role !== "USER") {
    return null;
  }

  const metadata = asRecord(message.metadata);
  const card = asRecord(metadata.card);
  const fallbackName =
    extractUploadedFileName(message.content) ||
    extractUploadedFileName(getString(card.message));
  const sources = [
    asRecord(metadata.file),
    asRecord(card.file),
    asRecord(metadata.uploadedFile),
    asRecord(card.uploadedFile),
    metadata,
  ];

  for (const source of sources) {
    const file = toPreviewableStrategyFile(source, fallbackName);

    if (file) {
      return file;
    }
  }

  return null;
}

function isPdfUploadFile(file: PreviewableStrategyFile) {
  return (
    file.mimeType?.toLowerCase() === "application/pdf" ||
    /\.pdf$/i.test(file.originalName)
  );
}

function isImageUploadFile(file: PreviewableStrategyFile) {
  return (
    file.mimeType?.toLowerCase().startsWith("image/") ||
    /\.(png|jpe?g|gif|webp|bmp)$/i.test(file.originalName)
  );
}

function canPreviewFile(file: PreviewableStrategyFile | null) {
  return Boolean(file && (isPdfUploadFile(file) || isImageUploadFile(file)));
}

function canPreviewUploadFile(message: AgentMessage) {
  return canPreviewFile(getMessageUploadFile(message));
}

function getUploadFileActionText(message: AgentMessage) {
  const file = getMessageUploadFile(message);

  if (!file) {
    return "";
  }

  if (previewingFileId.value === file.id) {
    return "读取中";
  }

  if (file.status === "failed") {
    return "读取失败";
  }

  if (file.status === "uploaded") {
    return "读取中";
  }

  return "预览";
}

function shouldShowUserMessageText(message: AgentMessage) {
  return Boolean(message.content && !getMessageUploadFile(message));
}

function getUploadFileKind(message: AgentMessage) {
  const file = getMessageUploadFile(message);

  if (!file) {
    return "file";
  }

  if (isImageUploadFile(file)) {
    return "image";
  }

  if (isPdfUploadFile(file)) {
    return "pdf";
  }

  return "file";
}

function getUploadFileKindLabel(message: AgentMessage) {
  const kind = getUploadFileKind(message);

  if (kind === "image") {
    return "图";
  }

  if (kind === "pdf") {
    return "PDF";
  }

  return "文";
}

function formatFileSize(size?: number | null) {
  if (!size || size <= 0) {
    return "";
  }

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function formatUploadSize(size?: number | null) {
  return formatFileSize(size) || "未知大小";
}

function getFileExtension(value?: string | null) {
  const normalized = (value || "").split(/[?#]/)[0] || "";
  const index = normalized.lastIndexOf(".");

  return index >= 0 ? normalized.slice(index + 1).toLowerCase() : "";
}

function isSupportedMaterialAgentExtension(value?: string | null) {
  const extension = getFileExtension(value);

  return Boolean(
    extension && MATERIAL_AGENT_SUPPORTED_EXTENSION_SET.has(extension),
  );
}

function showUnsupportedMaterialAgentFileToast(skippedCount?: number) {
  uni.showToast({
    title: skippedCount
      ? `已跳过 ${skippedCount} 个不支持格式`
      : "仅支持素材白名单格式",
    icon: "none",
  });
}

function resolveUploadedMaterialType(file: CommonUploadedFile): MaterialType {
  const mimeType = (file.mimeType || "").toLowerCase();
  const extension = getFileExtension(file.originalName || file.url);

  if (mimeType.startsWith("image/")) {
    return "image";
  }
  if (mimeType.startsWith("video/")) {
    return "video";
  }
  if (mimeType.startsWith("audio/")) {
    return "audio";
  }

  if (MATERIAL_AGENT_IMAGE_EXTENSIONS.includes(extension)) {
    return "image";
  }
  if (MATERIAL_AGENT_VIDEO_EXTENSIONS.includes(extension)) {
    return "video";
  }
  if (MATERIAL_AGENT_AUDIO_EXTENSIONS.includes(extension)) {
    return "audio";
  }
  if (MATERIAL_AGENT_DOCUMENT_EXTENSIONS.includes(extension)) {
    return "document";
  }

  return "document";
}

function resolveMaterialTypeLabel(type?: MaterialType | null) {
  if (type === "image") {
    return "图";
  }
  if (type === "video") {
    return "视频";
  }
  if (type === "audio") {
    return "音频";
  }

  return "文档";
}

function isPreviewableMaterialImage(attachment: PendingMaterialAttachment) {
  return attachment.materialType === "image" && Boolean(attachment.url);
}

function normalizeUploadedMaterialAttachment(
  file: CommonUploadedFile,
  index: number,
): PendingMaterialAttachment | null {
  const url = file.url || file.storageUrl || "";
  if (!url) {
    return null;
  }

  return {
    ...file,
    id:
      file.id ||
      file.sha256 ||
      `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
    url,
    originalName: file.originalName || `material-${index + 1}`,
    size: Number(file.size) || 0,
    materialType: resolveUploadedMaterialType(file),
  };
}

function appendPendingMaterialAttachments(files: CommonUploadedFile[]) {
  const normalized = files
    .map((file, index) => normalizeUploadedMaterialAttachment(file, index))
    .filter((file): file is PendingMaterialAttachment => Boolean(file));
  if (!normalized.length) {
    return;
  }

  const nextFiles = [...pendingMaterialAttachments.value, ...normalized];
  if (nextFiles.length > MATERIAL_ATTACHMENT_MAX_COUNT) {
    uni.showToast({
      title: `最多添加 ${MATERIAL_ATTACHMENT_MAX_COUNT} 个素材`,
      icon: "none",
    });
  }

  pendingMaterialAttachments.value = nextFiles.slice(
    0,
    MATERIAL_ATTACHMENT_MAX_COUNT,
  );
  enterComposerMode("material");
}

function removePendingMaterialAttachment(id: string) {
  if (isBusy.value) {
    return;
  }

  pendingMaterialAttachments.value = pendingMaterialAttachments.value.filter(
    (attachment) => attachment.id !== id,
  );
}

function resetPendingMaterialAttachments() {
  pendingMaterialAttachments.value = [];
}

function toMaterialChatAttachments(): MaterialChatAttachment[] {
  return pendingMaterialAttachments.value.map((attachment) => ({
    id: attachment.id,
    url: attachment.url,
    originalName: attachment.originalName,
    mimeType: attachment.mimeType,
    size: attachment.size,
    storageKey: attachment.storageKey,
    storageProvider: attachment.storageProvider,
    sha256: attachment.sha256,
  }));
}

function getUploadFileMetaText(message: AgentMessage) {
  const file = getMessageUploadFile(message);

  if (!file) {
    return "";
  }

  const typeText = isImageUploadFile(file)
    ? "图片资料"
    : isPdfUploadFile(file)
      ? "PDF 资料"
      : file.mimeType || "资料文件";

  return [typeText, formatFileSize(file.size)].filter(Boolean).join(" · ");
}

function getUploadFileError(message: AgentMessage) {
  const file = getMessageUploadFile(message);

  return file ? filePreviewErrors[file.id] || "" : "";
}

function revokePreviewObjectUrl(url: string) {
  if (!url || !previewObjectUrls.has(url)) {
    return;
  }

  URL.revokeObjectURL(url);
  previewObjectUrls.delete(url);
}

function closeImagePreview() {
  revokePreviewObjectUrl(imagePreview.url);
  imagePreview.visible = false;
  imagePreview.url = "";
  imagePreview.name = "";
}

function cleanupPreviewObjectUrls() {
  closeImagePreview();
  for (const url of [...previewObjectUrls]) {
    revokePreviewObjectUrl(url);
  }
}

async function previewUploadFile(message: AgentMessage) {
  const file = getMessageUploadFile(message);

  if (!file || !canPreviewFile(file) || previewingFileId.value) {
    return;
  }

  filePreviewErrors[file.id] = "";
  previewingFileId.value = file.id;

  const pdfWindow = isPdfUploadFile(file) ? window.open("", "_blank") : null;

  if (pdfWindow) {
    pdfWindow.opener = null;
  }

  if (isPdfUploadFile(file) && !pdfWindow) {
    filePreviewErrors[file.id] = "浏览器阻止了新窗口，请允许弹窗后重试。";
    previewingFileId.value = "";
    return;
  }

  try {
    const blob = await fetchBlob(
      file.previewUrl || `/strategy/files/${file.id}/preview`,
    );
    const objectUrl = URL.createObjectURL(blob);
    previewObjectUrls.add(objectUrl);

    if (isImageUploadFile(file)) {
      closeImagePreview();
      imagePreview.url = objectUrl;
      imagePreview.name = file.originalName;
      imagePreview.visible = true;
      return;
    }

    if (pdfWindow) {
      pdfWindow.location.href = objectUrl;
    }

    window.setTimeout(() => revokePreviewObjectUrl(objectUrl), 60_000);
  } catch (err) {
    pdfWindow?.close();
    filePreviewErrors[file.id] = getUserErrorMessage(err, "资料预览读取失败");
  } finally {
    previewingFileId.value = "";
  }
}

function getSessionActivityDate(session: StrategyChatSessionSummary) {
  const dateSource =
    session.lastActivityAt ||
    session.lastMessageAt ||
    session.updatedAt ||
    session.createdAt;
  const date = new Date(dateSource);

  return Number.isNaN(date.getTime()) ? null : date;
}

function getLocalDateStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getSessionDayDiff(date: Date) {
  const todayStart = getLocalDateStart(new Date());
  const sessionDateStart = getLocalDateStart(date);

  return Math.floor(
    (todayStart.getTime() - sessionDateStart.getTime()) / SESSION_DAY_MS,
  );
}

function formatSessionDateLabel(session: StrategyChatSessionSummary) {
  const date = getSessionActivityDate(session);

  if (!date) {
    return "未知时间";
  }

  const dayDiff = getSessionDayDiff(date);

  if (dayDiff <= 0) {
    return "今天";
  }

  if (dayDiff === 1) {
    return "昨天";
  }

  if (dayDiff < 7) {
    return "7天内";
  }

  if (dayDiff < 30) {
    return "30天内";
  }

  return `${date.getFullYear()}年${date.getMonth() + 1}月`;
}

const accessibleBoardOptions = computed(() =>
  boardOptions.filter((board) => hasAllPermissions(board.requiredAll)),
);
const visibleFeatures = computed(() =>
  features.filter((feature) =>
    feature.boardType ? canAccessBoard(feature.boardType) : true,
  ),
);
const canUseStrategyUploadMaterial = computed(() =>
  hasAllPermissions(STRATEGY_UPLOAD_MATERIAL_SKILL_PERMISSIONS),
);
const canUseMaterialManage = computed(() =>
  hasAllPermissions(MATERIAL_MANAGE_PERMISSIONS),
);
const canUseUploadMaterial = computed(
  () => canUseStrategyUploadMaterial.value || canUseMaterialManage.value,
);
const canUploadMaterial = computed(() => {
  if (!canUseStrategyUploadMaterial.value) {
    return false;
  }

  const status = chatStore.diagnosisStatus;
  return !status || STRATEGY_UPLOAD_ALLOWED_STATUSES.has(status);
});
const sessionChats = computed(() =>
  chatStore.sessions.map((session) => ({
    id: session.id,
    title:
      session.title ||
      (session.agentCode === STRATEGY_AGENT_CODE
        ? "品牌战略诊断"
        : session.agentCode === MATERIAL_AGENT_CODE
          ? "素材智能体"
          : "新的聊天"),
    preview: session.lastMessage?.content || "",
    active: session.id === chatStore.sessionId,
  })),
);
const sessionChatGroups = computed<SessionChatGroup[]>(() =>
  chatStore.sessions.reduce<SessionChatGroup[]>((groups, session, index) => {
    const label = formatSessionDateLabel(session);
    const previousGroup = groups[groups.length - 1];
    const chat = sessionChats.value[index];

    if (!chat) {
      return groups;
    }

    if (!previousGroup || previousGroup.label !== label) {
      groups.push({
        label,
        items: [chat],
      });
      return groups;
    }

    previousGroup.items.push(chat);
    return groups;
  }, []),
);
const filteredBoards = computed(() => {
  const query = boardMenuQuery.value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "");
  if (!query) {
    return accessibleBoardOptions.value;
  }

  return accessibleBoardOptions.value.filter((board) =>
    board.searchText.includes(query),
  );
});
const homePageStyle = computed(
  () =>
    ({
      "--mobile-status-height": `${mobileStatusBarHeight.value}px`,
      "--mobile-nav-height": `${mobileNavHeight.value}px`,
      "--mobile-nav-content-height": `${mobileNavContentHeight.value}px`,
      "--mobile-nav-top-offset": `${mobileNavTopOffset.value}px`,
      "--mobile-right-safe-width": `${mobileRightSafeWidth.value}px`,
      "--mobile-capsule-safe-right": `${mobileCapsuleSafeRight.value}px`,
    }) as Record<string, string>,
);
const activeComposerModeMeta = computed(() =>
  activeComposerMode.value ? composerModes[activeComposerMode.value] : null,
);
const composerPlaceholder = computed(
  () => activeComposerModeMeta.value?.placeholder || "发消息...",
);
const visibleQuickActions = computed(() =>
  activeComposerMode.value ? [] : quickActions.filter(canUseQuickAction),
);
const isStrategyComposerMode = computed(
  () => activeComposerMode.value === "strategy",
);
const isMaterialComposerMode = computed(
  () => activeComposerMode.value === "material",
);

onLoad(async () => {
  initMobileChrome();
  authStore.restore();
  applyLocalSettings();
  updateMobileLayout();

  if (!authStore.isAuthenticated) {
    uni.reLaunch({
      url: "/pages/login/index",
    });
    return;
  }

  await refresh();
});

onUnload(() => {
  stopBusyTimer();
  cleanupPreviewObjectUrls();
});

watch(draft, () => {
  editorCursor.value = clampCursor(editorCursor.value);
  updateComposerInputHeight();
  updateBoardMenu();
});

watch(isMobileLayout, () => {
  updateComposerInputHeight();
});

watch(
  () => [chatStore.messages.length, chatStore.loading, chatStore.uploading],
  () => {
    scrollToBottom();
  },
);

watch(isBusy, (busy) => {
  if (busy) {
    startBusyTimer();
    return;
  }

  stopBusyTimer();
});

function toggleSidebar() {
  isSidebarCollapsed.value = !isSidebarCollapsed.value;
  isCompanyMenuVisible.value = false;
}

function toggleMobileSidebar() {
  const nextOpen = !isMobileSidebarOpen.value;

  if (nextOpen) {
    isSidebarCollapsed.value = false;
  } else {
    isCompanyMenuVisible.value = false;
  }

  isMobileSidebarOpen.value = nextOpen;
}

function closeMobileSidebar() {
  isMobileSidebarOpen.value = false;
  isCompanyMenuVisible.value = false;
}

function handlePageClick() {
  if (isBoardMenuVisible.value) {
    closeBoardMenu();
  }
}

function toggleCompanyMenu() {
  isCompanyMenuVisible.value = !isCompanyMenuVisible.value;
}

function handleSettingClick(action: (typeof settingItems)[number]["action"]) {
  if (action === "settings") {
    openSettings();
    return;
  }

  if (action === "feedback") {
    openFeedback();
    return;
  }

  if (action === "logout") {
    chatStore.resetForAccountSwitch();
    authStore.logout();
  }
}

function openFeedback() {
  isCompanyMenuVisible.value = false;
  feedbackError.value = "";
  resetFeedbackForm();
  isFeedbackVisible.value = true;
}

function closeFeedback() {
  if (feedbackSubmitting.value) {
    return;
  }

  isFeedbackVisible.value = false;
  resetFeedbackForm();
}

function resetFeedbackForm() {
  feedbackForm.description = "";
  feedbackImages.value = [];
  feedbackError.value = "";
}

function chooseFeedbackImages() {
  if (feedbackSubmitting.value) {
    return;
  }

  const remainingCount = FEEDBACK_MAX_IMAGE_COUNT - feedbackImages.value.length;
  if (remainingCount <= 0) {
    uni.showToast({
      title: `最多上传 ${FEEDBACK_MAX_IMAGE_COUNT} 张图片`,
      icon: "none",
    });
    return;
  }

  uni.chooseImage({
    count: remainingCount,
    sizeType: ["compressed"],
    sourceType: ["album", "camera"],
    success: (res) => {
      const filePaths = Array.isArray(res.tempFilePaths)
        ? res.tempFilePaths
        : [];
      const tempFiles = normalizeTempFileList(res.tempFiles);
      const pickedImages = Array.from({
        length: Math.max(filePaths.length, tempFiles.length),
      })
        .map((_, index) => {
          const tempFile = tempFiles[index];
          const filePath =
            filePaths[index] || resolvePickedFilePath(tempFile, "");
          const browserFile = isBrowserBlob(tempFile) ? tempFile : null;

          if (!filePath) {
            return null;
          }

          return {
            id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2)}`,
            url: filePath,
            filePath,
            fileName: resolvePickedFileName(
              browserFile ?? tempFile,
              filePath,
              `feedback-${index + 1}.png`,
            ),
            browserFile,
          } satisfies FeedbackImage;
        })
        .filter((image): image is FeedbackImage => Boolean(image));

      feedbackError.value = "";
      feedbackImages.value = [...feedbackImages.value, ...pickedImages].slice(
        0,
        FEEDBACK_MAX_IMAGE_COUNT,
      );
    },
  });
}

function removeFeedbackImage(id: string) {
  if (feedbackSubmitting.value) {
    return;
  }

  feedbackImages.value = feedbackImages.value.filter(
    (image) => image.id !== id,
  );
}

async function resolveFeedbackBrowserFiles() {
  const browserImages: Array<{
    file: Blob;
    fileName: string;
    name: string;
  }> = [];

  for (const image of feedbackImages.value) {
    if (image.browserFile) {
      browserImages.push({
        file: image.browserFile,
        fileName: image.fileName,
        name: "images",
      });
      continue;
    }

    if (!image.filePath.startsWith("blob:") || typeof fetch === "undefined") {
      return null;
    }

    const response = await fetch(image.filePath);
    const blob = await response.blob();
    browserImages.push({
      file: blob,
      fileName: image.fileName,
      name: "images",
    });
  }

  return browserImages;
}

async function createFeedbackTicket(description: string) {
  if (!feedbackImages.value.length) {
    return await request<FeedbackTicketResponse>("/feedback/tickets", {
      method: "POST",
      data: {
        description,
      },
    });
  }

  const browserFiles = await resolveFeedbackBrowserFiles();
  if (browserFiles) {
    return await uploadBrowserFiles<FeedbackTicketResponse>(
      "/feedback/tickets",
      {
        files: browserFiles,
        formData: {
          description,
        },
      },
    );
  }

  return await uploadFiles<FeedbackTicketResponse>("/feedback/tickets", {
    files: feedbackImages.value.map((image) => ({
      filePath: image.filePath,
      fileName: image.fileName,
      name: "images",
    })),
    formData: {
      description,
    },
  });
}

async function submitFeedback() {
  const description = feedbackForm.description.trim();
  if (!description) {
    feedbackError.value = "请输入问题描述";
    return;
  }

  feedbackSubmitting.value = true;
  feedbackError.value = "";

  try {
    await createFeedbackTicket(description);

    resetFeedbackForm();
    isFeedbackVisible.value = false;
    uni.showToast({
      title: "反馈已提交",
      icon: "success",
    });
  } catch (err) {
    const message = getUserErrorMessage(err, "反馈提交失败");
    feedbackError.value = message;
    uni.showToast({
      title: message,
      icon: "none",
    });
  } finally {
    feedbackSubmitting.value = false;
  }
}

function getLocalSettingsKey() {
  const accountKey =
    authStore.user?.sub ||
    authStore.user?.loginName ||
    authStore.user?.email ||
    "anonymous";

  return `${LOCAL_SETTINGS_KEY}:${accountKey}`;
}

function readLocalSettings(): LocalSettings {
  try {
    const raw = uni.getStorageSync(getLocalSettingsKey());
    const parsed =
      typeof raw === "string" && raw
        ? (JSON.parse(raw) as Partial<LocalSettings>)
        : ((raw as Partial<LocalSettings> | undefined) ?? {});

    return {
      avatarUrl: authStore.user?.avatarUrl || parsed.avatarUrl || "",
      nickname:
        authStore.user?.nickname ||
        authStore.user?.name ||
        parsed.nickname ||
        "",
      phone: authStore.user?.phone || parsed.phone || "",
    };
  } catch {
    return {
      avatarUrl: authStore.user?.avatarUrl || "",
      nickname: authStore.user?.nickname || authStore.user?.name || "",
      phone: authStore.user?.phone || "",
    };
  }
}

function persistLocalSettings(settings: LocalSettings) {
  uni.setStorageSync(getLocalSettingsKey(), JSON.stringify(settings));
}

function applyLocalSettings() {
  const settings = readLocalSettings();
  settingsForm.avatarUrl = settings.avatarUrl;
  settingsForm.nickname = settings.nickname;
  settingsForm.phone = settings.phone;
  clearPasswordFields();
}

function clearPasswordFields() {
  settingsForm.currentPassword = "";
  settingsForm.newPassword = "";
  settingsForm.confirmPassword = "";
}

function clearPendingAvatarSelection() {
  pendingAvatarFilePath.value = "";
  pendingAvatarFileName.value = "";
  pendingAvatarBrowserFile.value = null;
  avatarUploadPromise = null;
  avatarUploading.value = false;
}

function applyUserSettings(user: AuthUser) {
  settingsForm.avatarUrl = user.avatarUrl || "";
  settingsForm.nickname = user.nickname || user.name || "";
  settingsForm.phone = user.phone || "";
}

function applyMeContext(context: MeContext) {
  meContext.value = context;

  if (!context.user) {
    return;
  }

  authStore.patchLocalUser(context.user);
  applyUserSettings(context.user);
  persistLocalSettings({
    avatarUrl: settingsForm.avatarUrl,
    nickname: settingsForm.nickname,
    phone: settingsForm.phone,
  });
}

async function fetchMe() {
  settingsLoading.value = true;
  const fetchVersion = ++meFetchVersion;
  const avatarVersionAtStart = avatarEditVersion;

  try {
    const context = await request<MeContext>("/me");
    if (
      fetchVersion !== meFetchVersion ||
      avatarVersionAtStart !== avatarEditVersion
    ) {
      return;
    }

    applyMeContext(context);
  } catch {
    meContext.value = null;
  } finally {
    settingsLoading.value = false;
  }
}

function openSettings() {
  isCompanyMenuVisible.value = false;
  isSettingsVisible.value = true;
  activeSettingsMenu.value = "account";
  settingsError.value = "";
  clearPendingAvatarSelection();
  applyLocalSettings();
  void fetchMe();
}

function closeSettings() {
  isSettingsVisible.value = false;
}

function setActiveSettingsMenu(menuId: SettingsMenuId) {
  activeSettingsMenu.value = menuId;
  settingsError.value = "";
}

async function resetAvatar() {
  if (settingsSaving.value || avatarUploading.value || avatarResetting.value) {
    return;
  }

  settingsError.value = "";
  clearPendingAvatarSelection();
  avatarEditVersion += 1;
  meFetchVersion += 1;
  avatarResetting.value = true;

  try {
    const result = await request<MeAvatarClearResponse>("/me/avatar", {
      method: "DELETE",
    });

    if (result.context) {
      applyMeContext(result.context);
    } else {
      authStore.patchLocalUser({ avatarUrl: undefined });
    }

    settingsForm.avatarUrl = "";
    persistLocalSettings({
      avatarUrl: "",
      nickname: settingsForm.nickname,
      phone: settingsForm.phone,
    });
    uni.showToast({
      title: "头像已重置",
      icon: "success",
    });
  } catch (err) {
    showSettingsError(err, "头像删除失败");
    if (settingsUser.value) {
      applyUserSettings(settingsUser.value);
    } else {
      applyLocalSettings();
    }
  } finally {
    avatarResetting.value = false;
  }
}

function resetPasswordForm() {
  settingsError.value = "";
  clearPasswordFields();
}

function isBrowserBlob(value: unknown): value is Blob {
  return typeof Blob !== "undefined" && value instanceof Blob;
}

function normalizeTempFileList(files: unknown) {
  return Array.isArray(files) ? files : files ? [files] : [];
}

function resolvePickedFilePath(file: unknown, fallbackPath: string) {
  if (file && typeof file === "object") {
    const record = file as Record<string, unknown>;
    if (typeof record.path === "string" && record.path) {
      return record.path;
    }
    if (typeof record.tempFilePath === "string" && record.tempFilePath) {
      return record.tempFilePath;
    }
  }

  return fallbackPath;
}

function resolvePickedFileName(
  file: unknown,
  fallbackPath: string,
  fallbackName: string,
) {
  if (file && typeof file === "object") {
    const record = file as Record<string, unknown>;
    if (typeof record.name === "string" && record.name) {
      return record.name;
    }
    if (typeof record.path === "string" && record.path) {
      return record.path.split(/[\\/]/).pop() || fallbackName;
    }
    if (typeof record.tempFilePath === "string" && record.tempFilePath) {
      return record.tempFilePath.split(/[\\/]/).pop() || fallbackName;
    }
  }

  return fallbackPath.split(/[\\/]/).pop() || fallbackName;
}

function resolvePickedAvatarName(file: unknown, fallbackPath: string) {
  return resolvePickedFileName(file, fallbackPath, "avatar.png");
}

function resolvePickedMaterialImageName(file: unknown, filePath: string) {
  const fallbackName = `strategy-material-${Date.now()}.jpg`;
  const candidate = resolvePickedFileName(file, filePath, fallbackName);

  if (MATERIAL_IMAGE_EXTENSION_PATTERN.test(candidate)) {
    return candidate;
  }

  const pathWithoutQuery = filePath.split(/[?#]/)[0] || "";
  const extension = pathWithoutQuery.match(
    MATERIAL_IMAGE_EXTENSION_PATTERN,
  )?.[0];

  return `strategy-material-${Date.now()}${extension || ".jpg"}`;
}

async function uploadPendingAvatar() {
  if (pendingAvatarBrowserFile.value) {
    return await uploadBrowserFile<MeAvatarUploadResponse>("/me/avatar", {
      file: pendingAvatarBrowserFile.value,
      fileName: pendingAvatarFileName.value || undefined,
    });
  }

  if (
    pendingAvatarFilePath.value.startsWith("blob:") &&
    typeof fetch !== "undefined"
  ) {
    const response = await fetch(pendingAvatarFilePath.value);
    const blob = await response.blob();

    return await uploadBrowserFile<MeAvatarUploadResponse>("/me/avatar", {
      file: blob,
      fileName: pendingAvatarFileName.value || undefined,
    });
  }

  return await upload<MeAvatarUploadResponse>("/me/avatar", {
    filePath: pendingAvatarFilePath.value,
    fileName: pendingAvatarFileName.value || undefined,
  });
}

async function uploadAndPersistAvatar() {
  if (avatarUploadPromise) {
    return await avatarUploadPromise;
  }

  avatarUploading.value = true;
  const uploadVersion = avatarEditVersion;

  let promise!: Promise<string>;
  promise = (async () => {
    const draftSettings = {
      nickname: settingsForm.nickname,
      phone: settingsForm.phone,
      currentPassword: settingsForm.currentPassword,
      newPassword: settingsForm.newPassword,
      confirmPassword: settingsForm.confirmPassword,
    };
    const uploadedAvatar = await uploadPendingAvatar();
    if (
      uploadVersion !== avatarEditVersion ||
      avatarUploadPromise !== promise
    ) {
      return uploadedAvatar.avatarUrl;
    }

    if (uploadedAvatar.context) {
      applyMeContext(uploadedAvatar.context);
    } else {
      authStore.patchLocalUser({ avatarUrl: uploadedAvatar.avatarUrl });
    }

    settingsForm.nickname = draftSettings.nickname;
    settingsForm.phone = draftSettings.phone;
    settingsForm.currentPassword = draftSettings.currentPassword;
    settingsForm.newPassword = draftSettings.newPassword;
    settingsForm.confirmPassword = draftSettings.confirmPassword;
    settingsForm.avatarUrl =
      uploadedAvatar.context?.user?.avatarUrl || uploadedAvatar.avatarUrl;
    settingsError.value = "";
    pendingAvatarFilePath.value = "";
    pendingAvatarFileName.value = "";
    pendingAvatarBrowserFile.value = null;

    uni.showToast({
      title: "头像已更新",
      icon: "success",
    });

    return uploadedAvatar.avatarUrl;
  })();

  avatarUploadPromise = promise;

  try {
    return await promise;
  } catch (err) {
    if (
      uploadVersion === avatarEditVersion &&
      avatarUploadPromise === promise
    ) {
      showSettingsError(err, "头像上传失败");
    }
    throw err;
  } finally {
    if (avatarUploadPromise === promise) {
      avatarUploading.value = false;
      avatarUploadPromise = null;
    }
  }
}

function chooseAvatar() {
  uni.chooseImage({
    count: 1,
    sizeType: ["compressed"],
    sourceType: ["album", "camera"],
    success: (res) => {
      const filePath = res.tempFilePaths[0] || "";
      const tempFiles = normalizeTempFileList(res.tempFiles);
      const browserFile = tempFiles.find(isBrowserBlob) ?? null;

      settingsError.value = "";
      avatarEditVersion += 1;
      meFetchVersion += 1;
      settingsForm.avatarUrl = filePath;
      pendingAvatarFilePath.value = filePath;
      pendingAvatarBrowserFile.value = browserFile;
      pendingAvatarFileName.value = resolvePickedAvatarName(
        browserFile ?? tempFiles[0],
        filePath,
      );
      void uploadAndPersistAvatar().catch(() => undefined);
    },
  });
}

async function saveSettings() {
  if (settingsSaving.value) {
    return;
  }

  settingsError.value = "";
  settingsSaving.value = true;

  try {
    let avatarUrl = settingsForm.avatarUrl;

    if (avatarUploadPromise) {
      avatarUrl = await avatarUploadPromise;
      settingsForm.avatarUrl = avatarUrl;
    } else if (pendingAvatarFilePath.value) {
      const uploadedAvatar = await uploadPendingAvatar();
      avatarUrl = uploadedAvatar.avatarUrl;
      settingsForm.avatarUrl = avatarUrl;
    }

    const data: Record<string, unknown> = {
      nickname: settingsForm.nickname,
      phone: settingsForm.phone,
    };

    const context = await request<MeContext>("/me/profile", {
      method: "PUT",
      data,
    });

    applyMeContext(context);
    settingsError.value = "";
    pendingAvatarFilePath.value = "";
    pendingAvatarFileName.value = "";
    pendingAvatarBrowserFile.value = null;
    avatarUploadPromise = null;
    uni.showToast({
      title: "账号设置已保存",
      icon: "success",
    });
    closeSettings();
  } catch (err) {
    showSettingsError(err, "账号设置保存失败");
  } finally {
    settingsSaving.value = false;
  }
}

function validatePasswordSettings() {
  if (
    !settingsForm.currentPassword ||
    !settingsForm.newPassword ||
    !settingsForm.confirmPassword
  ) {
    settingsError.value = "请完整填写密码修改信息";
    uni.showToast({
      title: settingsError.value,
      icon: "none",
    });
    return false;
  }

  if (settingsForm.newPassword.length < 6) {
    settingsError.value = "新密码至少需要 6 位";
    uni.showToast({
      title: settingsError.value,
      icon: "none",
    });
    return false;
  }

  if (settingsForm.newPassword !== settingsForm.confirmPassword) {
    settingsError.value = "两次输入的新密码不一致";
    uni.showToast({
      title: settingsError.value,
      icon: "none",
    });
    return false;
  }

  return true;
}

async function savePasswordSettings() {
  if (settingsSaving.value || !validatePasswordSettings()) {
    return;
  }

  settingsError.value = "";
  settingsSaving.value = true;

  try {
    await request<MeContext>("/me/profile", {
      method: "PUT",
      data: {
        currentPassword: settingsForm.currentPassword,
        newPassword: settingsForm.newPassword,
      },
    });

    clearPasswordFields();
    uni.showToast({
      title: "密码已修改",
      icon: "success",
    });
    closeSettings();
  } catch (err) {
    showSettingsError(err, "密码修改失败");
  } finally {
    settingsSaving.value = false;
  }
}

async function refresh() {
  pageLoading.value = true;

  try {
    await fetchMe();
    await chatStore.initialize();
    syncComposerModeWithCurrentSession();
    await scrollToBottom();
  } catch (err) {
    showError(err, "读取会话失败");
  } finally {
    pageLoading.value = false;
  }
}

async function createSession() {
  if (isBusy.value) {
    return;
  }

  draft.value = "";
  resetPendingMaterialAttachments();
  closeBoardMenu();
  closeMoreMenu();
  chatStore.startNewConversation();
  syncComposerModeWithCurrentSession();
  closeMobileSidebar();
  await nextTick();
  updateComposerInputHeight();
}

async function selectSession(sessionId: string) {
  try {
    await chatStore.selectSession(sessionId);
    syncComposerModeWithCurrentSession();
    closeMobileSidebar();
    await scrollToBottom();
  } catch (err) {
    showError(err, "读取会话失败");
  }
}

function handleSessionMore() {
  uni.showToast({
    title: "更多操作暂未开放",
    icon: "none",
  });
}

async function handleFeatureSelect(feature: Feature) {
  if (feature.action === "strategy-chat") {
    try {
      await chatStore.enterStrategy();
      enterComposerMode("strategy");
      await scrollToBottom();
    } catch (err) {
      showError(err, "进入失败");
    }
    return;
  }

  if (feature.boardType) {
    navigateBoard(feature.boardType);
  }
}

function handleQuickAction(action: QuickAction) {
  if (action.interactive === false) {
    return;
  }

  if (action.type === "board") {
    closeMoreMenu();
    openBoardMenuFromAction();
    return;
  }

  if (action.type === "upload") {
    closeMoreMenu();
    chooseMaterial();
    return;
  }

  if (action.type === "mode") {
    enterComposerMode(action.mode);
    closeMoreMenu();
    closeBoardMenu();
    syncNativeTextareaCursor();
    return;
  }

  closeMoreMenu();
  sendPreset(action.prompt, Boolean(action.strategy));
}

function cancelComposerMode() {
  if (activeComposerMode.value === "material") {
    resetPendingMaterialAttachments();
  }
  activeComposerMode.value = null;
  closeMoreMenu();
}

function enterComposerMode(mode: ComposerModeId) {
  activeComposerMode.value = mode;
  closeBoardMenu();
}

function syncComposerModeWithCurrentSession() {
  activeComposerMode.value = chatStore.sessionId
    ? chatStore.activeAgentCode === STRATEGY_AGENT_CODE
      ? "strategy"
      : chatStore.activeAgentCode === MATERIAL_AGENT_CODE
        ? "material"
        : null
    : null;

  if (activeComposerMode.value !== "material") {
    resetPendingMaterialAttachments();
  }

  if (activeComposerMode.value) {
    closeBoardMenu();
  }
}

function closeMoreMenu() {
  // Reserved for the old More menu close path. The More entry is currently removed.
}

function confirmAction(content: string) {
  return new Promise<boolean>((resolve) => {
    uni.showModal({
      title: "确认操作",
      content,
      confirmText: "确认",
      cancelText: "取消",
      success: (res) => resolve(Boolean(res.confirm)),
      fail: () => resolve(false),
    });
  });
}

async function runMaterialCardAction(
  task: () => Promise<unknown>,
  successTitle: string,
  fallback: string,
) {
  chatStore.loading = true;

  try {
    await task();
    await scrollToBottom();
    uni.showToast({
      title: successTitle,
      icon: "success",
    });
  } catch (err) {
    showError(err, fallback);
  } finally {
    chatStore.loading = false;
  }
}

async function handleCardAction(
  action: string,
  payload?: Record<string, unknown>,
) {
  if (isBusy.value) {
    return;
  }

  const actionPayload = payload ?? {};

  if (action === "material_upload_more") {
    enterComposerMode("material");
    chooseMaterial();
    return;
  }

  if (action === "material_update_draft") {
    const draftId = getString(actionPayload.draftId);
    if (!draftId) {
      return;
    }

    const changes: {
      description?: string;
      directoryName?: string;
      materialName?: string;
      tags?: string[];
      regenerate?: boolean;
    } = {};

    if (hasOwnValue(actionPayload, "description")) {
      changes.description = getString(actionPayload.description);
    }
    if (hasOwnValue(actionPayload, "directoryName")) {
      changes.directoryName = getString(actionPayload.directoryName);
    }
    if (hasOwnValue(actionPayload, "materialName")) {
      changes.materialName = getString(actionPayload.materialName);
    }
    if (hasOwnValue(actionPayload, "tags")) {
      changes.tags = getStringArray(actionPayload.tags);
    }
    if (actionPayload.regenerate === true) {
      changes.regenerate = true;
    }

    await runMaterialCardAction(
      () => chatStore.updateMaterialDraft(draftId, changes),
      changes.regenerate ? "已重新生成" : "已保存",
      "保存素材草稿失败",
    );
    return;
  }

  if (action === "material_generate_metadata") {
    const draftIds = Array.isArray(actionPayload.draftIds)
      ? actionPayload.draftIds.map(String).filter(Boolean)
      : [];
    if (!draftIds.length) {
      return;
    }

    await runMaterialCardAction(
      () => chatStore.generateMaterialMetadata(draftIds),
      "已生成",
      "生成素材信息失败",
    );
    return;
  }

  if (action === "material_remove_draft") {
    const draftId = getString(actionPayload.draftId);
    if (!draftId || !(await confirmAction("确认删除这个临时区素材草稿？"))) {
      return;
    }

    await runMaterialCardAction(
      () => chatStore.removeMaterialDraft(draftId),
      "已删除",
      "删除素材草稿失败",
    );
    return;
  }

  if (action === "material_batch_generate_drafts") {
    const draftIds = Array.isArray(actionPayload.draftIds)
      ? actionPayload.draftIds.map(String).filter(Boolean)
      : [];
    const description = getString(actionPayload.description);

    if (!draftIds.length || !description) {
      return;
    }

    await runMaterialCardAction(
      async () => {
        for (const draftId of draftIds) {
          await chatStore.updateMaterialDraft(draftId, {
            description,
            regenerate: true,
          });
        }
      },
      "已生成",
      "生成素材信息失败",
    );
    return;
  }

  if (action === "material_batch_update_drafts") {
    const changes = Array.isArray(actionPayload.changes)
      ? actionPayload.changes
          .map((item) => {
            const change = asRecord(item);
            const draftId = getString(change.draftId);

            if (!draftId) {
              return null;
            }

            return {
              draftId,
              description: getString(change.description),
              directoryName: getString(change.directoryName),
              materialName: getString(change.materialName),
              tags: getStringArray(change.tags),
            };
          })
          .filter(
            (
              change,
            ): change is {
              draftId: string;
              description: string;
              directoryName: string;
              materialName: string;
              tags: string[];
            } => Boolean(change),
          )
      : [];

    if (!changes.length) {
      return;
    }

    await runMaterialCardAction(
      async () => {
        for (const change of changes) {
          await chatStore.updateMaterialDraft(change.draftId, {
            description: change.description,
            directoryName: change.directoryName,
            materialName: change.materialName,
            tags: change.tags,
          });
        }
      },
      "已保存",
      "保存素材草稿失败",
    );
    return;
  }

  if (action === "material_batch_remove_drafts") {
    const draftIds = Array.isArray(actionPayload.draftIds)
      ? actionPayload.draftIds.map(String).filter(Boolean)
      : [];
    if (
      !draftIds.length ||
      !(await confirmAction(`确认删除选中的 ${draftIds.length} 个临时区素材草稿？`))
    ) {
      return;
    }

    await runMaterialCardAction(
      async () => {
        for (const draftId of draftIds) {
          await chatStore.removeMaterialDraft(draftId);
        }
      },
      "已批量删除",
      "批量删除素材草稿失败",
    );
    return;
  }

  if (action === "material_confirm_drafts") {
    const draftIds = Array.isArray(actionPayload.draftIds)
      ? actionPayload.draftIds.map(String).filter(Boolean)
      : [];
    const changes = Array.isArray(actionPayload.changes)
      ? actionPayload.changes
          .map((item) => {
            const change = asRecord(item);
            const draftId = getString(change.draftId);

            if (!draftId) {
              return null;
            }

            return {
              draftId,
              description: getString(change.description),
              directoryName: getString(change.directoryName),
              materialName: getString(change.materialName),
              tags: getStringArray(change.tags),
            };
          })
          .filter(
            (
              change,
            ): change is {
              draftId: string;
              description: string;
              directoryName: string;
              materialName: string;
              tags: string[];
            } => Boolean(change),
          )
      : [];
    if (!draftIds.length) {
      return;
    }

    await runMaterialCardAction(
      () => chatStore.confirmMaterialDrafts(draftIds, changes),
      "已入库",
      "确认素材入库失败",
    );
    return;
  }

  if (action === "material_update_asset") {
    const assetId = getString(actionPayload.assetId);
    if (!assetId) {
      return;
    }

    const changes: {
      materialName?: string;
      description?: string;
      directoryName?: string;
      tags?: string[];
    } = {};

    if (hasOwnValue(actionPayload, "materialName")) {
      changes.materialName = getString(actionPayload.materialName);
    }
    if (hasOwnValue(actionPayload, "description")) {
      changes.description = getString(actionPayload.description);
    }
    if (hasOwnValue(actionPayload, "directoryName")) {
      changes.directoryName = getString(actionPayload.directoryName);
    }
    if (hasOwnValue(actionPayload, "tags")) {
      changes.tags = getStringArray(actionPayload.tags);
    }

    if (!Object.keys(changes).length) {
      return;
    }

    await runMaterialCardAction(
      () => chatStore.updateMaterialAsset(assetId, changes),
      "已保存",
      "保存素材信息失败",
    );
    return;
  }

  if (action === "material_recycle_asset") {
    const assetId = getString(actionPayload.assetId);
    const materialName = getString(actionPayload.materialName) || "该素材";
    if (
      !assetId ||
      !(await confirmAction(`确认将“${materialName}”移入回收站？`))
    ) {
      return;
    }

    await runMaterialCardAction(
      () => chatStore.recycleMaterialAsset(assetId),
      "已移入回收站",
      "删除素材失败",
    );
    return;
  }

  if (action === "material_batch_recycle_assets") {
    const assetIds = Array.isArray(actionPayload.assetIds)
      ? actionPayload.assetIds.map(String).filter(Boolean)
      : [];
    if (
      !assetIds.length ||
      !(await confirmAction(
        `确认将选中的 ${assetIds.length} 个素材移入回收站？`,
      ))
    ) {
      return;
    }

    await runMaterialCardAction(
      () => chatStore.batchRecycleMaterialAssets(assetIds),
      "已移入回收站",
      "批量删除素材失败",
    );
    return;
  }

  if (action === "material_restore_asset") {
    const assetId = getString(actionPayload.assetId);
    const materialName = getString(actionPayload.materialName) || "该素材";
    if (
      !assetId ||
      !(await confirmAction(`确认将“${materialName}”恢复到正式区？`))
    ) {
      return;
    }

    await runMaterialCardAction(
      () => chatStore.restoreMaterialAsset(assetId),
      "已恢复",
      "恢复素材失败",
    );
    return;
  }

  if (action === "open_dashboard") {
    navigateBoard("brand-strategy");
    return;
  }

  if (action === "view_report") {
    const reportType = typeof payload?.type === "string" ? payload.type : "";
    const diagnosisId =
      typeof payload?.diagnosisId === "string" ? payload.diagnosisId : null;

    if (reportType) {
      try {
        await openReportModal(reportType, { diagnosisId });
      } catch (err) {
        showError(err, "读取报告失败");
      }
    }
    return;
  }

  const mappedReportType = reportActionTypes[action];

  if (mappedReportType) {
    try {
      await openReportModal(mappedReportType);
    } catch (err) {
      showError(err, "读取报告失败");
    }
    return;
  }

  if (action === "upload_files" || action === "upload_more_files") {
    chooseMaterial();
    return;
  }

  if (action === "supplement_form") {
    uni.showToast({
      title: "请在输入框按字段名补充缺失内容",
      icon: "none",
    });
    return;
  }

  const prompt = actionPrompts[action];

  if (!prompt) {
    uni.showToast({
      title: "请在输入框补充具体内容",
      icon: "none",
    });
    return;
  }

  try {
    await chatStore.sendStrategy(prompt);
    syncComposerModeWithCurrentSession();
    await scrollToBottom();
  } catch (err) {
    showError(err, "发送失败");
  }
}

async function openReportModal(
  reportType: string,
  options: { diagnosisId?: string | null } = {},
) {
  activeReportResponse.value = null;
  isReportModalVisible.value = true;
  reportModalLoading.value = true;

  try {
    const result = await chatStore.openReport(reportType, options);

    if (!result) {
      isReportModalVisible.value = false;
      return;
    }

    activeReportResponse.value = result;
    syncComposerModeWithCurrentSession();
  } catch (err) {
    isReportModalVisible.value = false;
    throw err;
  } finally {
    reportModalLoading.value = false;
  }
}

function closeReportModal() {
  if (!reportModalLoading.value) {
    isReportModalVisible.value = false;
  }
}

async function handleReportModalAction(action: string) {
  if (action === "export_report_pdf") {
    const report = activeReportResponse.value?.report;
    const reportType = typeof report?.type === "string" ? report.type : "";
    const diagnosisId =
      typeof report?.diagnosisId === "string" ? report.diagnosisId : null;

    if (!reportType) {
      return;
    }

    reportModalLoading.value = true;
    try {
      await chatStore.exportReportPdf(reportType, { diagnosisId });
      uni.showToast({
        title: "报告已开始下载",
        icon: "none",
      });
    } catch (err) {
      showError(err, "导出失败");
    } finally {
      reportModalLoading.value = false;
    }
    return;
  }

  if (action === "open_dashboard") {
    closeReportModal();
  }

  await handleCardAction(action);

  if (action === "rediagnose" || action === "sync_reports") {
    closeReportModal();
  }
}

function handleDraftInput(event: Event) {
  const detail = (
    event as Event & {
      detail?: {
        value?: string;
        cursor?: number;
      };
    }
  ).detail;
  const value = detail?.value ?? draft.value;
  draft.value = value;
  editorCursor.value =
    typeof detail?.cursor === "number"
      ? clampCursor(detail.cursor)
      : clampCursor(value.length);
  updateBoardMenu();
}

function handleEditorFocus() {
  isEditorFocused.value = true;
  closeMoreMenu();
  clearBoardMenuCloseTimer();
  syncNativeTextareaCursor();
  updateBoardMenu();
}

function handleEditorBlur() {
  isEditorFocused.value = false;
  isComposing.value = false;
  clearBoardMenuCloseTimer();
  boardMenuCloseTimer.value = setTimeout(() => {
    closeBoardMenu();
  }, 120);
}

function handleEditorCompositionStart() {
  isComposing.value = true;
}

function handleEditorCompositionEnd() {
  isComposing.value = false;
}

function handleEditorPointerEnd() {
  setTimeout(() => {
    syncNativeTextareaCursor();
    updateBoardMenu();
  }, 0);
}

function handleEditorKeydown(event: KeyboardEvent) {
  if (
    event.key !== "Enter" ||
    event.shiftKey ||
    isComposing.value ||
    event.isComposing ||
    event.keyCode === 229
  ) {
    return;
  }

  event.preventDefault();
  sendMessage();
}

function clearBoardMenuCloseTimer() {
  if (boardMenuCloseTimer.value) {
    clearTimeout(boardMenuCloseTimer.value);
    boardMenuCloseTimer.value = null;
  }
}

function clampCursor(cursor: number) {
  return Math.max(0, Math.min(cursor, draft.value.length));
}

function syncNativeTextareaCursor() {
  // #ifdef H5
  const textarea = document.querySelector<HTMLTextAreaElement>(
    "textarea.message-input, .message-input textarea",
  );
  if (textarea && typeof textarea.selectionStart === "number") {
    editorCursor.value = clampCursor(textarea.selectionStart);
  }
  // #endif
}

function resolveBoardTriggerAtCursor() {
  const cursor = clampCursor(editorCursor.value);
  const beforeCursor = draft.value.slice(0, cursor);
  const match = beforeCursor.match(/(^|[\s\n])@([^\s@]{0,24})$/);

  if (!match) {
    return null;
  }

  const sourceText = match[0] ?? "";
  const prefix = match[1] ?? "";

  return {
    start: cursor - sourceText.length + prefix.length,
    end: cursor,
    query: match[2] ?? "",
  };
}

async function updateBoardMenu(options: { force?: boolean } = {}) {
  await nextTick();

  if (isBusy.value || activeComposerMode.value) {
    closeBoardMenu();
    return;
  }

  const cursor = clampCursor(editorCursor.value);
  const trigger = options.force
    ? {
        start: cursor,
        end: cursor,
        query: "",
      }
    : resolveBoardTriggerAtCursor();

  if (!trigger) {
    closeBoardMenu();
    return;
  }

  boardMenuTrigger.value = trigger;
  boardMenuQuery.value = trigger.query;
  isBoardMenuVisible.value = true;

  await nextTick();
  updateBoardMenuPosition();
}

function closeBoardMenu() {
  isBoardMenuVisible.value = false;
  boardMenuQuery.value = "";
  boardMenuTrigger.value = null;
}

function openBoardMenuFromAction() {
  if (activeComposerMode.value) {
    closeBoardMenu();
    return;
  }

  closeMoreMenu();
  clearBoardMenuCloseTimer();
  syncNativeTextareaCursor();
  updateBoardMenu({ force: true });
}

function normalizeRect(rect: unknown): RectLike | null {
  if (!rect || typeof rect !== "object") {
    return null;
  }

  const value = rect as {
    left?: number;
    top?: number;
    width?: number;
    height?: number;
    right?: number;
    bottom?: number;
  };
  const left = Number(value.left ?? 0);
  const top = Number(value.top ?? 0);
  const width = Number(value.width ?? 0);
  const height = Number(value.height ?? 0);

  if (!width || !height) {
    return null;
  }

  return {
    left,
    top,
    width,
    height,
    right: Number(value.right ?? left + width),
    bottom: Number(value.bottom ?? top + height),
  };
}

function estimateTextWidth(text: string) {
  return Array.from(text).reduce((width, char) => {
    if (char === "\t") {
      return width + 24;
    }

    if (char === " ") {
      return width + 4;
    }

    return width + (/[\u2E80-\u9FFF\uF900-\uFAFF]/.test(char) ? 12 : 7);
  }, 0);
}

function estimateCaretOffset(inputWidth: number) {
  const cursor = clampCursor(editorCursor.value);
  const beforeCursor = draft.value.slice(0, cursor);
  const maxLineWidth = Math.max(40, inputWidth - 8);
  const lineHeight = 20;
  let line = 0;
  let x = 0;

  for (const char of Array.from(beforeCursor)) {
    if (char === "\n") {
      line += 1;
      x = 0;
      continue;
    }

    const width = estimateTextWidth(char);
    if (x + width > maxLineWidth) {
      line += 1;
      x = 0;
    }
    x += width;
  }

  return {
    x: Math.min(x, maxLineWidth),
    y: line * lineHeight,
    lineHeight,
  };
}

function updateBoardMenuPosition() {
  uni
    .createSelectorQuery()
    .select(".main-panel")
    .boundingClientRect()
    .select(".composer")
    .boundingClientRect()
    .select(".editor-wrap")
    .boundingClientRect()
    .exec((results) => {
      const mainRect = normalizeRect(results?.[0]);
      const composerRect = normalizeRect(results?.[1]);
      const editorRect = normalizeRect(results?.[2]);

      if (!mainRect || !composerRect || !editorRect) {
        boardMenuStyle.value = "left:16px;top:96px;width:320px;";
        return;
      }

      const horizontalPadding = 16;
      const availableWidth = Math.max(
        240,
        Math.min(composerRect.width, mainRect.width - horizontalPadding * 2),
      );
      const menuWidth = Math.min(352, availableWidth);
      const estimatedMenuHeight = Math.min(
        408,
        37 + Math.max(1, filteredBoards.value.length) * 62,
      );
      const preferredLeft = editorRect.left - mainRect.left;
      const maxLeft = Math.max(
        horizontalPadding,
        mainRect.width - menuWidth - horizontalPadding,
      );
      const left = Math.min(
        Math.max(horizontalPadding, preferredLeft),
        maxLeft,
      );
      const top = Math.max(
        16,
        editorRect.top - mainRect.top - estimatedMenuHeight - 8,
      );

      boardMenuStyle.value = [
        `left:${Math.round(left)}px`,
        `top:${Math.round(top)}px`,
        `width:${Math.round(menuWidth)}px`,
      ].join(";");
    });
}

async function sendPreset(content: string, strategy = false) {
  if (isBusy.value) {
    return;
  }

  try {
    if (isMaterialComposerMode.value) {
      await chatStore.sendMaterial(content);
    } else if (strategy || isStrategyComposerMode.value) {
      await chatStore.sendStrategy(content);
    } else {
      await chatStore.sendBase(content);
    }
    syncComposerModeWithCurrentSession();
    await scrollToBottom();
  } catch (err) {
    showError(err, "发送失败");
  }
}

async function sendMessage() {
  const content = draft.value.trim();
  const materialAttachments = isMaterialComposerMode.value
    ? toMaterialChatAttachments()
    : [];
  if (
    isBusy.value ||
    materialAttachmentUploading.value ||
    isComposing.value ||
    (!content && materialAttachments.length === 0)
  ) {
    return;
  }

  draft.value = "";
  const previousMaterialAttachments = pendingMaterialAttachments.value;
  if (materialAttachments.length > 0) {
    resetPendingMaterialAttachments();
  }
  closeBoardMenu();
  closeMoreMenu();

  try {
    if (isMaterialComposerMode.value) {
      await chatStore.sendMaterial(content, materialAttachments);
    } else if (isStrategyComposerMode.value) {
      await chatStore.sendStrategy(content);
    } else {
      await chatStore.sendBase(content);
    }
    syncComposerModeWithCurrentSession();
    await scrollToBottom();
  } catch (err) {
    draft.value = content;
    if (materialAttachments.length > 0) {
      pendingMaterialAttachments.value = previousMaterialAttachments;
    }
    showError(err, "发送失败");
  }
}

function selectBoard(board: BoardOption) {
  draft.value = "";
  closeBoardMenu();
  closeMoreMenu();
  navigateBoard(board.id);
}

function navigateBoard(type: BoardType) {
  if (!canAccessBoard(type)) {
    uni.showToast({
      title: "当前账号暂无该看板权限",
      icon: "none",
    });
    return;
  }

  closeMobileSidebar();
  uni.navigateTo({
    url: `/pages/boards/basic?type=${encodeURIComponent(type)}`,
  });
}

function initMobileChrome() {
  const systemInfo = uni.getSystemInfoSync();
  const statusBarHeight = systemInfo.statusBarHeight || 0;

  mobileStatusBarHeight.value = statusBarHeight;
  mobileNavContentHeight.value = 44;
  mobileNavTopOffset.value = 0;
  mobileNavHeight.value = statusBarHeight + 56;
  mobileRightSafeWidth.value = 58;
  mobileCapsuleSafeRight.value = 14;

  // #ifdef MP-WEIXIN
  const menuButton = uni.getMenuButtonBoundingClientRect();
  const topGap = Math.max(0, menuButton.top - statusBarHeight);
  const bottomGap = topGap || 6;

  mobileNavContentHeight.value = menuButton.height;
  mobileNavTopOffset.value = topGap;
  mobileNavHeight.value = menuButton.bottom + bottomGap;
  mobileRightSafeWidth.value =
    Math.max(88, systemInfo.windowWidth - menuButton.left) + 12;
  mobileCapsuleSafeRight.value = mobileRightSafeWidth.value;
  // #endif
}

function chooseMaterial() {
  if (isBusy.value || materialAttachmentUploading.value) {
    return;
  }

  if (!canUseUploadMaterial.value) {
    uni.showToast({
      title: "当前账号暂无上传资料权限",
      icon: "none",
    });
    return;
  }

  closeMoreMenu();

  const chooseStrategy = () => {
    if (!canUploadMaterial.value) {
      uni.showToast({
        title: "当前诊断阶段暂不支持上传资料",
        icon: "none",
      });
      return;
    }

    chooseStrategyMaterialFile();
  };

  const chooseLibrary = () => {
    if (!canUseMaterialManage.value) {
      uni.showToast({
        title: "当前账号暂无素材智能体权限",
        icon: "none",
      });
      return;
    }

    enterComposerMode("material");
    chooseMaterialLibraryFile();
  };

  if (isMaterialComposerMode.value) {
    chooseLibrary();
    return;
  }

  if (isStrategyComposerMode.value) {
    chooseStrategy();
    return;
  }

  if (canUseMaterialManage.value && !canUseStrategyUploadMaterial.value) {
    chooseLibrary();
    return;
  }

  if (!canUseMaterialManage.value) {
    chooseStrategy();
    return;
  }

  uni.showActionSheet({
    itemList: ["上传到素材库", "上传战略诊断资料"],
    success: (res) => {
      if (res.tapIndex === 0) {
        chooseLibrary();
        return;
      }

      chooseStrategy();
    },
  });
}

function chooseStrategyMaterialFile() {
  // #ifdef MP-WEIXIN
  uni.showActionSheet({
    itemList: ["从手机相册选择图片", "选择 PDF/文档"],
    success: (res) => {
      if (res.tapIndex === 0) {
        chooseStrategyMaterialImage();
        return;
      }

      chooseStrategyMaterialDocument();
    },
  });
  return;
  // #endif

  // #ifdef H5
  const h5Uni = uni as unknown as {
    chooseFile?: (options: {
      count: number;
      extension?: string[];
      success: (res: { tempFiles: PickedFile[] }) => void;
    }) => void;
  };
  const chooseFile = h5Uni.chooseFile;

  if (chooseFile) {
    (chooseFile as NonNullable<typeof chooseFile>)({
      count: 1,
      extension: MATERIAL_SUPPORTED_EXTENSIONS,
      success: (res) => uploadPickedFile(res.tempFiles[0]),
    });
    return;
  }

  if (typeof document !== "undefined") {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = MATERIAL_SUPPORTED_EXTENSIONS.map(
      (extension) => `.${extension}`,
    ).join(",");
    input.style.display = "none";
    input.addEventListener(
      "change",
      () => {
        const file = input.files?.[0];
        input.remove();
        uploadPickedBrowserFile(file);
      },
      { once: true },
    );
    document.body.appendChild(input);
    input.click();
    return;
  }
  // #endif

  uni.showToast({
    title: "当前端暂不支持文件选择",
    icon: "none",
  });
}

function chooseStrategyMaterialImage() {
  uni.chooseImage({
    count: 1,
    sizeType: ["compressed"],
    sourceType: ["album"],
    success: (res) => {
      const filePaths = Array.isArray(res.tempFilePaths)
        ? res.tempFilePaths
        : [];
      const tempFiles = normalizeTempFileList(res.tempFiles);
      const tempFile = tempFiles[0];
      const filePath = filePaths[0] || resolvePickedFilePath(tempFile, "");
      const tempRecord =
        tempFile && typeof tempFile === "object"
          ? (tempFile as PickedFile)
          : {};

      uploadPickedFile({
        ...tempRecord,
        path: filePath || tempRecord.path,
        name: resolvePickedMaterialImageName(tempFile, filePath),
      });
    },
  });
}

function chooseStrategyMaterialDocument() {
  uni.chooseMessageFile({
    count: 1,
    type: "file",
    extension: MATERIAL_DOCUMENT_EXTENSIONS,
    success: (res) => {
      const file = res.tempFiles[0] as PickedFile | undefined;
      uploadPickedFile(file);
    },
  });
}

function getMaterialUploadDescription() {
  return draft.value.trim();
}

function clearMaterialUploadDescription(description: string) {
  if (description && draft.value.trim() === description) {
    draft.value = "";
    updateComposerInputHeight();
  }
}

function chooseMaterialLibraryFile() {
  // #ifdef MP-WEIXIN
  uni.showActionSheet({
    itemList: ["选择文件/视频/音频", "从手机相册选择图片"],
    success: (res) => {
      if (res.tapIndex === 0) {
        chooseMaterialLibraryMessageFiles();
        return;
      }

      chooseMaterialLibraryImages();
    },
  });
  return;
  // #endif

  // #ifdef H5
  const h5Uni = uni as unknown as {
    chooseFile?: (options: {
      count: number;
      extension?: string[];
      success: (res: { tempFiles: PickedFile[] }) => void;
    }) => void;
  };
  const chooseFile = h5Uni.chooseFile;

  if (chooseFile) {
    (chooseFile as NonNullable<typeof chooseFile>)({
      count: 20,
      extension: MATERIAL_AGENT_SUPPORTED_EXTENSIONS,
      success: (res) => uploadPickedMaterialFiles(res.tempFiles),
    });
    return;
  }

  if (typeof document !== "undefined") {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = MATERIAL_AGENT_SUPPORTED_EXTENSIONS.map(
      (extension) => `.${extension}`,
    ).join(",");
    input.style.display = "none";
    input.addEventListener(
      "change",
      () => {
        const files = Array.from(input.files ?? []);
        input.remove();
        uploadPickedMaterialBrowserFiles(files);
      },
      { once: true },
    );
    document.body.appendChild(input);
    input.click();
    return;
  }
  // #endif

  uni.showToast({
    title: "当前端暂不支持文件选择",
    icon: "none",
  });
}

function chooseMaterialLibraryImages() {
  uni.chooseImage({
    count: 20,
    sizeType: ["original", "compressed"],
    sourceType: ["album"],
    success: (res) => {
      const filePaths = Array.isArray(res.tempFilePaths)
        ? res.tempFilePaths
        : [];
      const tempFiles = normalizeTempFileList(res.tempFiles);
      const pickedFiles = Array.from({
        length: Math.max(filePaths.length, tempFiles.length),
      })
        .map((_, index) => {
          const tempFile = tempFiles[index];
          const filePath =
            filePaths[index] || resolvePickedFilePath(tempFile, "");
          const tempRecord =
            tempFile && typeof tempFile === "object"
              ? (tempFile as PickedFile)
              : {};

          return {
            ...tempRecord,
            path: filePath || tempRecord.path,
            name: resolvePickedMaterialImageName(tempFile, filePath),
          };
        })
        .filter((file) => file.path || file.tempFilePath);

      uploadPickedMaterialFiles(pickedFiles);
    },
  });
}

function chooseMaterialLibraryMessageFiles() {
  uni.chooseMessageFile({
    count: 20,
    type: "all",
    extension: MATERIAL_AGENT_SUPPORTED_EXTENSIONS,
    success: (res) => {
      uploadPickedMaterialFiles(res.tempFiles as PickedFile[]);
    },
  });
}

async function uploadPickedBrowserFile(file?: File) {
  if (!file) {
    uni.showToast({
      title: "未选择有效文件",
      icon: "none",
    });
    return;
  }

  try {
    await chatStore.uploadMaterial({
      browserFile: file,
      fileName: file.name,
    });
    syncComposerModeWithCurrentSession();
    await scrollToBottom();
    uni.showToast({
      title: "资料已上传",
      icon: "success",
    });
  } catch (err) {
    showError(err, "上传失败");
  }
}

async function uploadPickedFile(file?: PickedFile) {
  const filePath = file?.path || file?.tempFilePath;
  if (!filePath) {
    uni.showToast({
      title: "未选择有效文件",
      icon: "none",
    });
    return;
  }

  try {
    await chatStore.uploadMaterial({
      filePath,
      fileName: file?.name,
    });
    syncComposerModeWithCurrentSession();
    await scrollToBottom();
    uni.showToast({
      title: "资料已上传",
      icon: "success",
    });
  } catch (err) {
    showError(err, "上传失败");
  }
}

async function uploadPickedMaterialBrowserFiles(files: File[]) {
  if (!files.length) {
    uni.showToast({
      title: "未选择有效文件",
      icon: "none",
    });
    return;
  }

  const supportedFiles = files.filter((file) =>
    isSupportedMaterialAgentExtension(file.name),
  );
  const skippedCount = files.length - supportedFiles.length;

  if (!supportedFiles.length) {
    showUnsupportedMaterialAgentFileToast();
    return;
  }

  materialAttachmentUploading.value = true;
  try {
    const result = await uploadBrowserFiles<CommonUploadFilesResponse>(
      "/uploads/files",
      {
        files: supportedFiles.map((file) => ({
          file,
          fileName: file.name,
          name: "files",
        })),
      },
    );
    appendPendingMaterialAttachments(result.files);
    uni.showToast({
      title: skippedCount ? `已添加，跳过 ${skippedCount} 个` : "素材已添加",
      icon: skippedCount ? "none" : "success",
    });
  } catch (err) {
    showError(err, "上传素材失败");
  } finally {
    materialAttachmentUploading.value = false;
  }
}

async function uploadPickedMaterialFiles(files?: PickedFile[] | PickedFile) {
  const normalizedFiles = Array.isArray(files) ? files : files ? [files] : [];
  const uploadFileItems = normalizedFiles
    .map((file, index) => {
      const filePath = file.path || file.tempFilePath || "";
      const fileName = resolvePickedFileName(
        file,
        filePath,
        `material-${Date.now()}-${index + 1}`,
      );

      return {
        filePath,
        fileName,
      };
    })
    .filter((file): file is { filePath: string; fileName: string } =>
      Boolean(file.filePath),
    );

  if (!uploadFileItems.length) {
    uni.showToast({
      title: "未选择有效文件",
      icon: "none",
    });
    return;
  }

  const supportedUploadFileItems = uploadFileItems.filter(
    (file) =>
      isSupportedMaterialAgentExtension(file.fileName) ||
      isSupportedMaterialAgentExtension(file.filePath),
  );
  const skippedCount = uploadFileItems.length - supportedUploadFileItems.length;

  if (!supportedUploadFileItems.length) {
    showUnsupportedMaterialAgentFileToast();
    return;
  }

  materialAttachmentUploading.value = true;
  try {
    const result = await uploadFiles<CommonUploadFilesResponse>(
      "/uploads/files",
      {
        files: supportedUploadFileItems.map((file) => ({
          filePath: file.filePath ?? "",
          fileName: file.fileName,
          name: "files",
        })),
      },
    );
    appendPendingMaterialAttachments(result.files);
    uni.showToast({
      title: skippedCount ? `已添加，跳过 ${skippedCount} 个` : "素材已添加",
      icon: skippedCount ? "none" : "success",
    });
  } catch (err) {
    showError(err, "上传素材失败");
  } finally {
    materialAttachmentUploading.value = false;
  }
}

async function scrollToBottom() {
  await nextTick();
  messageScrollTop.value += 100000;
}

function startBusyTimer() {
  if (!busyStartedAt.value) {
    busyStartedAt.value = Date.now();
    busyElapsedSeconds.value = 0;
  }

  if (busyTimer) {
    return;
  }

  busyTimer = setInterval(() => {
    if (!busyStartedAt.value) {
      busyElapsedSeconds.value = 0;
      return;
    }

    busyElapsedSeconds.value = Math.floor(
      (Date.now() - busyStartedAt.value) / 1000,
    );
  }, 1000);
}

function stopBusyTimer() {
  if (busyTimer) {
    clearInterval(busyTimer);
    busyTimer = null;
  }

  busyStartedAt.value = null;
  busyElapsedSeconds.value = 0;
}

function formatTime(value: string) {
  const date = new Date(value);
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${hours}:${minutes}`;
}

function showError(err: unknown, fallback: string) {
  const message = getUserErrorMessage(err, fallback);

  uni.showToast({
    title: message,
    icon: "none",
  });
}

function showSettingsError(err: unknown, fallback: string) {
  const message = getUserErrorMessage(err, fallback);
  settingsError.value = message;
  uni.showToast({
    title: message,
    icon: "none",
  });
}
</script>

<style>
page {
  height: 100%;
  overflow: hidden;
}

.home-page {
  height: 100vh;
  height: 100dvh;
  min-height: 100vh;
  overflow: hidden;
  background: #ffffff;
  user-select: text;
}

.mobile-nav,
.mobile-sidebar-mask,
.mobile-attach-button {
  display: none;
}

.workspace {
  display: flex;
  height: 100vh;
  min-height: 100vh;
  overflow: hidden;
}

.sidebar {
  position: relative;
  width: 240px;
  flex: 0 0 240px;
  padding: 16px 0 68px;
  overflow: hidden;
  background: linear-gradient(180deg, #f6f7f9 0%, #f2f4f7 100%);
  border-right: 1px solid #edf0f4;
  transition:
    width 0.22s ease,
    flex-basis 0.22s ease,
    padding 0.22s ease;
}

.PC-layout {
  padding-top: 10px;
}

.sidebar.collapsed {
  width: 0;
  flex-basis: 0;
  padding-right: 0;
  padding-left: 0;
  border-right-color: transparent;
}

.sidebar-content {
  /* width: 166px; */
  height: 100%;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding-left: 13px;
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  gap: 6px;
}

.brand-mark {
  display: flex;
  justify-content: center;
  width: 48px;
  height: 48px;
}

.brand-logo {
  width: 100%;
  height: 100%;
}

.company-short-name {
  font-size: 13px;
  line-height: 20px;
  color: #000;
  flex: 1;
  min-width: 0;
  /* 防止文字溢出 */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: "Noto Sans SC";
  /* 使用思源黑体 */
}

.company {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding: 0 12px;
  color: #44566c;
  font-size: 12px;
}

.new-chat {
  display: flex;
  width: calc(100% - 40px);
  height: 40px;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin: 0 20px 30px;
  color: #1167ff;
  font-size: 14px;
  font-weight: 700;
  line-height: 44px;
  background: #ffffff;
  border: 0;
  border-radius: 999px;
  box-shadow: 0 8px 22px rgb(20 35 70 / 12%);
  overflow: hidden;
  padding: 0;
  transition:
    box-shadow 0.18s ease,
    opacity 0.18s ease,
    transform 0.18s ease;
}

.new-chat:not(:disabled):hover {
  box-shadow: 0 10px 26px rgb(20 35 70 / 16%);
  transform: translateY(-1px);
}

.new-chat:disabled {
  cursor: not-allowed;
  opacity: 0.58;
}

.new-chat::after,
.chat-item::after,
.chat-more::after,
.company::after,
.setting-item::after,
.collapse-button::after,
.feature-card::after,
.quick-action::after,
.plus::after,
.send-button::after {
  border: 0;
}

.button-icon {
  width: 22px;
  height: 22px;
}

.chat-list {
  flex: 1;
  box-sizing: border-box;
  height: calc(100vh - 282px);
  /* padding: 0 12px 24px; */
  overflow-y: auto;
  overflow-x: hidden;
  font-size: 14px;
}

.chat-section {
  margin-bottom: 22px;
}

.date-label {
  display: block;
  margin: 0 12px 14px;
  color: #999;
  font-size: 12px;
  font-weight: 400;
  line-height: 22px;
}

.chat-item {
  position: relative;
  display: flex;
  box-sizing: border-box;
  width: 100%;
  min-height: 38px;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin: 0 0 4px;
  padding: 0 12px 0 16px;
  color: #2d3138;
  font-size: 14px;
  font-weight: 400;
  line-height: 22px;
  text-align: left;
  background: transparent;
  border: 0;
  border-radius: 10px;
  box-shadow: none;
  cursor: pointer;
  transition:
    background 0.16s ease,
    box-shadow 0.16s ease,
    color 0.16s ease;
}

.chat-title {
  display: block;
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-item:hover,
.chat-item:focus-visible {
  background: #eaebed;
}

.chat-item.active {
  color: #252a33;
  font-weight: 700;
  background: #ffffff;
  box-shadow: 0 4px 14px rgb(21 31 52 / 8%);
}

.chat-more {
  display: flex;
  width: 28px;
  height: 28px;
  flex: 0 0 28px;
  align-items: center;
  justify-content: center;
  padding: 0;
  color: #92979f;
  font-size: 14px;
  line-height: 28px;
  background: transparent;
  border: 0;
  border-radius: 50%;
  box-shadow: none;
  opacity: 0;
  transition:
    background 0.16s ease,
    opacity 0.16s ease;
}

.chat-item:hover .chat-more,
.chat-item:focus-within .chat-more,
.chat-item.active .chat-more {
  opacity: 1;
}

.chat-more:hover {
  background: rgb(37 42 51 / 8%);
}

.company-menu-wrap {
  position: absolute;
  bottom: 16px;
  left: 16px;
  right: 10px;
}

.settings-card {
  position: absolute;
  bottom: 41px;
  left: 0;
  width: 125px;
  padding: 6px;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 8px 22px rgb(28 43 74 / 13%);
}

.setting-item {
  display: flex;
  width: 100%;
  height: 36px;
  align-items: center;
  gap: 8px;
  padding: 0 9px;
  color: #2f3540;
  font-size: 14px;
  line-height: 27px;
  text-align: left;
  white-space: nowrap;
  background: transparent;
  border: 0;
  border-radius: 5px;
  box-shadow: none;
}

.setting-item > text:last-child {
  display: block;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  line-height: 27px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.setting-item.active {
  background: #f0f1f3;
}

.setting-icon {
  position: relative;
  width: 13px;
  height: 13px;
  flex: 0 0 13px;
}

.setting-icon::before,
.setting-icon::after {
  position: absolute;
  content: "";
  background: #596579;
}

.setting-icon.settings::before {
  inset: 2px;
  border: 2px solid #596579;
  background: transparent;
  border-radius: 50%;
}

.setting-icon.settings::after {
  top: 5px;
  left: 5px;
  width: 3px;
  height: 3px;
  border-radius: 50%;
}

.setting-icon.feedback::before {
  inset: 2px 1px 4px;
  content: "";
  background: transparent;
  border: 1.5px solid #596579;
  border-radius: 4px;
}

.setting-icon.feedback::after {
  bottom: 1px;
  left: 4px;
  width: 5px;
  height: 5px;
  content: "";
  background: transparent;
  border-bottom: 1.5px solid #596579;
  border-left: 1.5px solid #596579;
  transform: skew(-18deg);
}

.setting-icon.logout::before {
  top: 2px;
  left: 1px;
  width: 8px;
  height: 9px;
  border: 1px solid #596579;
  background: transparent;
  border-radius: 2px;
}

.setting-icon.logout::after {
  top: 6px;
  right: 1px;
  width: 7px;
  height: 1px;
}

.company {
  display: flex;
  width: 100%;
  min-width: 0;
  height: 28px;
  align-items: center;
  gap: 12px;
  color: #303640;
  font-size: 14px;
  line-height: 28px;
  padding: 0;
  text-align: left;
  background: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;
}

.avatar {
  display: grid;
  width: 25px;
  height: 25px;
  flex: 0 0 25px;
  place-items: center;
  overflow: hidden;
  color: #ffffff;
  font-size: 11px;
  font-weight: 700;
  background: #cfcfcf;
  border-radius: 50%;
}

.avatar image {
  width: 100%;
  height: 100%;
  display: block;
}

.company-name {
  display: block;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  line-height: 28px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.main-panel {
  position: relative;
  box-sizing: border-box;
  flex: 1;
  min-width: 0;
  height: calc(100vh - 36px);
  background: #ffffff;
}

.collapse-button {
  position: absolute;
  top: 24px;
  left: 15px;
  z-index: 5;
  display: grid;
  width: 20px;
  height: 20px;
  place-items: center;
  padding: 0;
  background: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;
}

.collapse-button.collapsed {
  transform: rotate(180deg);
}

.collapse-icon {
  width: 20px;
  height: 20px;
}

.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 67px;
}

.hero-title {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin: 0 0 45px;
  color: #2f333a;
  font-size: 18px;
  font-weight: 800;
  line-height: 1.35;
  letter-spacing: 0.5px;
}

.hero-title text {
  display: inline;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(3, 136px);
  gap: 55px 38px;
}

.feature-card {
  position: relative;
  width: 136px;
  height: 74px;
  padding: 34px 17px 11px;
  background: #f0f5fd;
  border: 0;
  border-radius: 10px;
  box-shadow: none;
  overflow: visible;
}

.feature-card:active {
  box-shadow:
    0 0 0 1px #cfe3ff,
    0 5px 14px rgb(43 133 255 / 22%);
}

.feature-visual {
  position: absolute;
  top: -25px;
  left: 50%;
  width: 84px;
  height: 58px;
  transform: translateX(-50%);
}

.feature-svg {
  width: 84px;
  height: 58px;
  display: block;
}

.feature-title {
  display: block;
  margin: 0 0 3px;
  color: #1f2733;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.2;
}

.feature-description {
  display: block;
  overflow: hidden;
  color: #647083;
  font-size: 9px;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.message-panel {
  box-sizing: border-box;
  height: calc(100vh - 184px);
  margin: 46px 0 26px 0;
  padding: 18px 0 18px 18px;
  overflow: hidden;
  width: initial;
}

.message-stream {
  box-sizing: border-box;
  width: min(100%, 868px);
  max-width: 868px;
  margin: 0 auto;
  overflow: hidden;
}

.pending-bar {
  margin-bottom: 14px;
  padding: 10px 12px;
  color: #8a4b00;
  font-size: 13px;
  line-height: 1.4;
  background: #fff7e6;
  border: 1px solid #ffe0a3;
  border-radius: 8px;
}

.message-row {
  box-sizing: border-box;
  display: flex;
  justify-content: flex-start;
  width: 100%;
  max-width: 100%;
  margin-bottom: 14px;
  overflow: hidden;
}

.message-row.mine {
  justify-content: flex-end;
  margin-right: 20px;
  width: calc(100% - 20px);
}

.message-row.material {
  width: 100%;
}

.message-bubble {
  box-sizing: border-box;
  min-width: 0;
  max-width: min(760px, 82%);
  overflow: hidden;
  padding: 12px 14px 10px;
}

.message-row.material .message-bubble {
  width: 100%;
  max-width: 100%;
}

.message-row.mine .message-bubble {
  color: #ffffff;
  background: #1267ff;
  border-color: #1267ff;
}

.message-content {
  display: block;
  max-width: 100%;
  overflow-wrap: anywhere;
  color: inherit;
  font-size: 14px;
  line-height: 1.75;
  white-space: pre-wrap;
  word-break: break-word;
}

.upload-file-card {
  box-sizing: border-box;
  display: flex;
  width: min(360px, 100%);
  min-width: 0;
  align-items: center;
  gap: 10px;
  padding: 10px;
  color: #263142;
  background: #ffffff;
  border: 1px solid rgb(255 255 255 / 70%);
  border-radius: 8px;
}

.upload-file-card.previewable {
  cursor: pointer;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.upload-file-card.previewable:hover {
  border-color: #bdd4ff;
  box-shadow: 0 8px 18px rgb(15 35 80 / 14%);
}

.upload-file-icon {
  display: flex;
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  align-items: center;
  justify-content: center;
  color: #1267ff;
  background: #edf5ff;
  border-radius: 8px;
}

.upload-file-icon text {
  font-size: 12px;
  font-weight: 800;
  line-height: 1;
}

.upload-file-icon.image {
  color: #047857;
  background: #e8f7ef;
}

.upload-file-icon.pdf {
  color: #b42318;
  background: #fff0ec;
}

.upload-file-main {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 2px;
}

.upload-file-label {
  color: #6b7280;
  font-size: 11px;
  line-height: 1.25;
}

.upload-file-name {
  max-width: 100%;
  overflow: hidden;
  color: #111827;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.upload-file-meta {
  max-width: 100%;
  overflow: hidden;
  color: #7a8596;
  font-size: 11px;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.upload-file-action {
  flex: 0 0 auto;
  color: #1267ff;
  font-size: 12px;
  font-weight: 700;
}

.upload-file-error {
  display: block;
  margin-top: 6px;
  color: #ffe3e3;
  font-size: 12px;
  line-height: 1.4;
}

.message-time {
  display: block;
  margin-top: 8px;
  color: #9aa5b5;
  font-size: 11px;
  text-align: right;
}

.message-row.mine .message-time {
  color: #d9e8ff;
}

.assistant-loading {
  align-self: flex-start;
  width: fit-content;
  padding: 10px 12px;
  color: #64748b;
  font-size: 13px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.error-text {
  margin: 0;
  color: #d93025;
  font-size: 12px;
  position: absolute;
  top: -22px;
}

.composer {
  position: absolute;
  right: auto;
  bottom: 0;
  left: 50%;
  display: flex;
  box-sizing: border-box;
  width: 68%;
  max-width: 1080px;
  min-width: 720px;
  min-height: 82px;
  max-height: min(214px, calc(100vh - 126px));
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
  padding: 12px 12px 10px 18px;
  background: #ffffff;
  border: 1px solid #a9c7ff;
  border-radius: 22px;
  box-shadow:
    0 0 0 1px rgb(31 126 255 / 4%),
    0 10px 28px rgb(42 103 255 / 12%);
  transform: translateX(-50%);
}

.editor-wrap {
  position: relative;
  box-sizing: border-box;
  flex: 0 1 auto;
  min-height: 32px;
  max-height: 132px;
  overflow: hidden;
}

.message-placeholder {
  position: absolute;
  top: 0;
  right: 12px;
  left: 0;
  z-index: 1;
  color: #a3a3a3;
  font-size: 14px;
  line-height: 22px;
  pointer-events: none;
}

.message-input {
  display: block;
  box-sizing: border-box;
  width: 100%;
  height: 32px;
  min-height: 32px;
  max-height: 132px;
  overflow-y: auto;
  padding: 0 12px 0 0;
  color: #1f2733;
  font-size: 14px;
  line-height: 22px;
  white-space: pre-wrap;
  word-break: break-word;
  background: transparent;
  border: 0;
  outline: 0;
  resize: none;
}

.message-input textarea {
  height: 100% !important;
  min-height: 100% !important;
  max-height: 100% !important;
  overflow-y: auto !important;
}

.composer-attachments {
  flex: 0 0 auto;
  width: 100%;
  min-height: 52px;
}

.composer-attachment-scroll {
  width: 100%;
  white-space: nowrap;
}

.composer-attachment-row {
  display: inline-flex;
  width: max-content;
  max-width: 100%;
  gap: 8px;
}

.composer-attachment {
  position: relative;
  display: inline-flex;
  width: 238px;
  height: 52px;
  box-sizing: border-box;
  align-items: center;
  gap: 9px;
  padding: 6px 28px 6px 7px;
  vertical-align: top;
  background: #f8fbff;
  border: 1px solid #dce9ff;
  border-radius: 8px;
}

.composer-attachment.uploading {
  color: #47617d;
  background: #f7f8fb;
  border-color: #e5e8ef;
}

.composer-attachment-thumb,
.composer-attachment-file {
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  overflow: hidden;
  border-radius: 7px;
  background: #e8f2ff;
}

.composer-attachment-file {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1267ff;
  font-size: 11px;
  font-weight: 700;
}

.composer-attachment-copy {
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 2px;
}

.composer-attachment-name,
.composer-attachment-meta {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.composer-attachment-name {
  color: #172033;
  font-size: 13px;
  font-weight: 600;
  line-height: 18px;
}

.composer-attachment-meta {
  color: #728096;
  font-size: 12px;
  line-height: 16px;
}

.composer-attachment-remove {
  position: absolute;
  top: 5px;
  right: 5px;
  display: flex;
  width: 18px;
  height: 18px;
  align-items: center;
  justify-content: center;
  color: #65758b;
  font-size: 15px;
  line-height: 18px;
  background: #ffffff;
  border: 1px solid #d9e2ef;
  border-radius: 50%;
}

.composer-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 0 0 auto;
  width: 100%;
  min-height: 28px;
}

.quick-actions {
  flex: 1 1 auto;
  width: 0;
  max-width: none;
  min-width: 0;
  color: #111827;
  font-size: 12px;
  white-space: nowrap;
}

.quick-action-row {
  display: inline-flex;
  width: max-content;
  align-items: center;
  gap: 14px;
  white-space: nowrap;
}

.plus {
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 24px;
  color: #111827;
  line-height: 24px;
  padding: 0;
  background: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;
}

.tool-divider {
  width: 1px;
  height: 18px;
  flex: 0 0 1px;
  background: #e0e3e8;
}

.quick-action {
  display: inline-flex;
  height: 26px;
  align-items: center;
  justify-content: center;
  gap: 0;
  flex: 0 0 auto;
  width: auto;
  min-width: 0;
  padding: 0;
  color: inherit;
  font-size: 12px;
  line-height: 26px;
  background: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;
}

.quick-action.more {
  gap: 6px;
}

.quick-action.active {
  color: #1267ff;
}

.quick-action.inert {
  cursor: default;
}

.quick-action.inert:active {
  background: transparent;
}

.mode-chip {
  display: inline-flex;
  width: auto;
  height: 26px;
  align-items: center;
  justify-content: center;
  gap: 5px;
  flex: 0 0 auto;
  margin: 0;
  padding: 0 10px;
  color: #1267ff;
  font-size: 12px;
  font-weight: 700;
  line-height: 26px;
  background: #eef4ff;
  border: 0;
  border-radius: 13px;
  box-shadow: none;
}

.mode-chip::after {
  border: 0;
}

.chip-close {
  color: #6f9bff;
  font-size: 14px;
  line-height: 1;
}

.tool-icon {
  position: relative;
  display: inline-block;
  width: 18px;
  height: 18px;
  flex: 0 0 18px;
}

.tool-icon.board::before,
.tool-icon.task::before,
.tool-icon.split::before,
.tool-icon.upload::before,
.tool-icon.image::before,
.tool-icon.strategy::before,
.tool-icon.report::before,
.tool-icon.ppt::before,
.tool-icon.table::before,
.tool-icon.power::before {
  position: absolute;
  inset: 2px;
  content: "";
  border: 1.6px solid currentColor;
  border-radius: 4px;
}

.tool-icon.board::after {
  position: absolute;
  top: 7px;
  left: 5px;
  width: 8px;
  height: 1.6px;
  content: "";
  background: currentColor;
  box-shadow: 0 4px 0 currentColor;
}

.tool-icon.task::after {
  position: absolute;
  top: 5px;
  left: 6px;
  width: 7px;
  height: 1.6px;
  content: "";
  background: currentColor;
  box-shadow:
    0 4px 0 currentColor,
    0 8px 0 currentColor;
}

.tool-icon.split::before {
  border-radius: 50%;
}

.tool-icon.split::after {
  position: absolute;
  top: 3px;
  left: 8px;
  width: 2px;
  height: 12px;
  content: "";
  background: currentColor;
  transform: rotate(28deg);
}

.tool-icon.upload::after {
  position: absolute;
  top: 4px;
  left: 6px;
  width: 6px;
  height: 6px;
  content: "";
  border-top: 1.8px solid currentColor;
  border-left: 1.8px solid currentColor;
  transform: rotate(45deg);
}

.tool-icon.image::after {
  position: absolute;
  right: 4px;
  bottom: 4px;
  left: 4px;
  height: 6px;
  content: "";
  background: linear-gradient(
    135deg,
    transparent 42%,
    currentColor 43% 58%,
    transparent 59%
  );
}

.tool-icon.strategy::before {
  border-radius: 50%;
}

.tool-icon.strategy::after {
  position: absolute;
  top: 2px;
  left: 8px;
  width: 2px;
  height: 14px;
  content: "";
  background: currentColor;
  transform: rotate(28deg);
}

.tool-icon.report::after,
.tool-icon.ppt::after,
.tool-icon.table::after {
  position: absolute;
  inset: 6px 4px auto;
  height: 1.5px;
  content: "";
  background: currentColor;
  box-shadow: 0 4px 0 currentColor;
}

.tool-icon.power::before {
  border-radius: 50%;
}

.tool-icon.power::after {
  position: absolute;
  top: 1px;
  left: 8px;
  width: 2px;
  height: 8px;
  content: "";
  background: currentColor;
}

.send-button {
  position: relative;
  display: inline-flex;
  width: 30px;
  height: 30px;
  align-items: center;
  justify-content: center;
  flex: 0 0 30px;
  margin-left: 12px;
  color: #ffffff;
  background: #1267ff;
  border-radius: 50%;
  box-shadow: 0 4px 12px rgb(18 103 255 / 28%);
  padding: 0;
  border: 0;
}

.send-button[disabled] {
  opacity: 1;
}

.send-button.is-disabled {
  background: #eff1f5;
  box-shadow: none;
}

.board-mention-menu {
  position: absolute;
  right: auto;
  bottom: auto;
  z-index: 20;
  width: 352px;
  max-width: calc(100% - 32px);
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #e8eef8;
  border-radius: 12px;
  box-shadow:
    0 16px 44px rgb(24 55 105 / 18%),
    0 0 0 1px rgb(18 103 255 / 4%);
}

.board-menu-title {
  display: flex;
  height: 37px;
  align-items: center;
  padding: 0 13px;
  color: #7a8494;
  font-size: 12px;
  line-height: 37px;
  border-bottom: 1px solid #eef2f7;
}

.board-menu-list {
  max-height: 372px;
  padding: 6px;
}

.board-option {
  display: flex;
  box-sizing: border-box;
  width: 100%;
  min-height: 58px;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  color: #1f2733;
  text-align: left;
  background: transparent;
  border: 0;
  border-radius: 9px;
  box-shadow: none;
  cursor: pointer;
}

.board-option:active,
.board-option:focus {
  background: #f2f7ff;
}

.board-option:focus {
  outline: 0;
}

.board-icon {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  flex: 0 0 34px;
  overflow: hidden;
  background: #f6f9ff;
  border-radius: 9px;
}

.board-icon image {
  width: 30px;
  height: 30px;
}

.board-copy {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 3px;
}

.board-name-row {
  display: flex;
  min-width: 0;
  align-items: baseline;
  gap: 8px;
}

.board-name {
  overflow: hidden;
  min-width: 0;
  color: #1f2733;
  font-size: 13px;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.board-alias {
  flex: 0 0 auto;
  color: #8d98aa;
  font-size: 11px;
}

.board-description {
  display: block;
  overflow: hidden;
  color: #647083;
  font-size: 11px;
  line-height: 16px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.settings-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background: rgb(0 0 0 / 12%);
}

.file-preview-overlay {
  position: fixed;
  inset: 0;
  z-index: 2600;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28px;
  background: rgb(15 23 42 / 72%);
}

.file-preview-panel {
  display: flex;
  width: min(1040px, calc(100vw - 56px));
  height: min(760px, calc(100vh - 56px));
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
  background: #ffffff;
  border-radius: 10px;
  box-shadow: 0 24px 80px rgb(0 0 0 / 28%);
}

.file-preview-header {
  position: relative;
  display: flex;
  min-height: 48px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 56px 10px 14px;
  border-bottom: 1px solid #e5e7eb;
}

.file-preview-title {
  min-width: 0;
  overflow: hidden;
  color: #111827;
  font-size: 14px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-preview-close {
  position: absolute;
  top: 50%;
  right: 14px;
  display: flex;
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0;
  color: #4b5563;
  font-size: 26px;
  font-weight: 300;
  line-height: 1;
  background: transparent;
  border: 0;
  border-radius: 0;
  transform: translateY(-50%);
}

.file-preview-close::after {
  border: 0;
}

.file-preview-image {
  width: 100%;
  min-height: 0;
  flex: 1;
  background: #0f172a;
}

.settings-panel {
  position: relative;
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  width: min(980px, calc(100vw - 96px));
  height: min(720px, calc(100vh - 96px));
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #d8d8d8;
  border-radius: 20px;
  box-shadow: 0 24px 70px rgb(15 23 42 / 18%);
}

.feedback-panel {
  box-sizing: border-box;
  width: min(520px, calc(100vw - 48px));
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  padding: 24px;
  background: #ffffff;
  border: 1px solid #d8d8d8;
  border-radius: 18px;
  box-shadow: 0 24px 70px rgb(15 23 42 / 18%);
}

.feedback-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  padding-bottom: 18px;
  border-bottom: 1px solid #ebebeb;
}

.feedback-title-copy {
  min-width: 0;
}

.feedback-title {
  display: block;
  color: #111111;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.25;
}

.feedback-subtitle {
  display: block;
  margin-top: 6px;
  color: #7a7a7a;
  font-size: 13px;
  line-height: 1.4;
}

.feedback-close {
  margin: 0;
}

.feedback-body {
  padding-top: 18px;
}

.feedback-textarea {
  box-sizing: border-box;
  width: 100%;
  height: 180px;
  padding: 13px 14px;
  color: #1f2733;
  font-size: 14px;
  line-height: 22px;
  background: #f7f7f7;
  border: 1px solid transparent;
  border-radius: 10px;
}

.feedback-counter {
  display: block;
  margin-top: 8px;
  color: #8b8b8b;
  font-size: 12px;
  line-height: 18px;
  text-align: right;
}

.feedback-image-section {
  padding-top: 14px;
}

.feedback-image-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  color: #4b5563;
  font-size: 13px;
  line-height: 20px;
}

.feedback-image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.feedback-image-item,
.feedback-image-add {
  position: relative;
  box-sizing: border-box;
  width: 76px;
  height: 76px;
  flex: 0 0 76px;
  margin: 0;
  overflow: hidden;
  border-radius: 10px;
}

.feedback-image-item {
  background: #f3f4f6;
}

.feedback-image-item image {
  display: block;
  width: 100%;
  height: 100%;
}

.feedback-image-remove {
  position: absolute;
  top: 5px;
  right: 5px;
  display: flex;
  width: 20px;
  height: 20px;
  align-items: center;
  justify-content: center;
  padding: 0;
  color: #ffffff;
  font-size: 16px;
  line-height: 20px;
  background: rgb(17 24 39 / 68%);
  border: 0;
  border-radius: 50%;
  box-shadow: none;
}

.feedback-image-remove::after {
  border: 0;
}

.feedback-image-add {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 0;
  color: #4b5563;
  font-size: 12px;
  line-height: 16px;
  background: #f7f7f7;
  border: 1px dashed #d1d5db;
  box-shadow: none;
}

.feedback-image-add::after {
  border: 0;
}

.feedback-image-add-icon {
  font-size: 22px;
  font-weight: 400;
  line-height: 18px;
}

.feedback-actions {
  padding-top: 18px;
}

.settings-nav {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 27px 24px;
  background: #ffffff;
}

.settings-close {
  position: relative;
  display: flex;
  width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  margin-bottom: 28px;
  padding: 0;
  overflow: visible;
  background: transparent;
  border: 0;
  border-radius: 8px;
  box-shadow: none;
}

.settings-panel-close {
  position: absolute;
  top: 22px;
  right: 22px;
  z-index: 2;
  margin: 0;
  background: #ffffff;
}

.settings-panel-close:hover {
  background: #f4f4f4;
}

.close-icon {
  position: relative;
  display: block;
  width: 20px;
  height: 20px;
}

.close-icon::before,
.close-icon::after {
  position: absolute;
  top: 9px;
  left: 2px;
  width: 16px;
  height: 2px;
  content: "";
  background: #111111;
  border-radius: 999px;
}

.close-icon::before {
  transform: rotate(45deg);
}

.close-icon::after {
  transform: rotate(-45deg);
}

.settings-nav-item {
  display: flex;
  width: 100%;
  height: 44px;
  align-items: center;
  gap: 12px;
  padding: 0 14px;
  color: #181818;
  font-size: 16px;
  line-height: 44px;
  text-align: left;
  white-space: nowrap;
  background: transparent;
  border: 0;
  box-shadow: none;
}

.settings-nav-item.active {
  background: #f2f2f2;
}

.settings-nav-icon {
  position: relative;
  width: 21px;
  height: 21px;
  flex: 0 0 21px;
}

.settings-nav-icon.account::before {
  position: absolute;
  top: 3px;
  left: 6px;
  width: 8px;
  height: 8px;
  content: "";
  border: 2px solid #181818;
  border-radius: 50%;
}

.settings-nav-icon.account::after {
  position: absolute;
  right: 2px;
  bottom: 2px;
  left: 2px;
  height: 9px;
  content: "";
  border: 2px solid #181818;
  border-top: 0;
  border-radius: 10px 10px 0 0;
}

.settings-nav-icon.password::before {
  position: absolute;
  top: 8px;
  right: 2px;
  bottom: 2px;
  left: 2px;
  content: "";
  border: 2px solid #181818;
  border-radius: 4px;
}

.settings-nav-icon.password::after {
  position: absolute;
  top: 2px;
  left: 6px;
  width: 9px;
  height: 9px;
  content: "";
  border: 2px solid #181818;
  border-bottom: 0;
  border-radius: 9px 9px 0 0;
}

.settings-nav-item > text:last-child {
  overflow: hidden;
  min-width: 0;
  line-height: 44px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.settings-content {
  height: 100%;
  min-width: 0;
  padding: 0;
  overflow: hidden;
}

.settings-content-inner {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  padding: 28px 64px 4px 16px;
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 24px;
  border-bottom: 1px solid #dedede;
}

.settings-title {
  color: #111111;
  font-size: 25px;
  font-weight: 600;
}

.settings-status {
  color: #8b8b8b;
  font-size: 13px;
}

.settings-error {
  display: block;
  margin-top: 12px;
  color: #c2410c;
  font-size: 13px;
  line-height: 20px;
}

.settings-section {
  padding: 12px 0;
  border-bottom: 1px solid #ebebeb;
}

.account-summary {
  display: flex;
  align-items: center;
  gap: 14px;
}

.avatar-preview {
  position: relative;
  display: grid;
  width: 58px;
  height: 58px;
  flex: 0 0 auto;
  place-items: center;
  overflow: hidden;
  color: #ffffff;
  font-size: 22px;
  font-weight: 700;
  background: #111827;
  border-radius: 50%;
}

.avatar-preview image {
  width: 100%;
  height: 100%;
  display: block;
}

.summary-text {
  min-width: 0;
  flex: 1;
}

.avatar-actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
}

.summary-name {
  display: block;
  overflow: hidden;
  color: #151515;
  font-size: 17px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.summary-id {
  display: block;
  overflow: hidden;
  margin-top: 5px;
  color: #6b6b6b;
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.section-title {
  display: block;
  margin-bottom: 12px;
  color: #111111;
  font-size: 17px;
  font-weight: 600;
}

.form-row,
.readonly-row {
  display: grid;
  grid-template-columns: 148px minmax(0, 1fr);
  min-height: 54px;
  align-items: center;
  gap: 20px;
}

.form-row > text,
.readonly-row > text:first-child {
  color: #111111;
  font-size: 16px;
}

.form-row input,
.readonly-row > text:last-child {
  min-width: 0;
  max-width: 520px;
  justify-self: stretch;
  color: #5b5b5b;
  font-size: 16px;
  font-weight: 400;
  text-align: right;
}

.form-row input {
  box-sizing: border-box;
  height: 38px;
  padding: 0 12px;
  background: #f7f7f7;
  border: 1px solid transparent;
  border-radius: 9px;
}

.secondary-button,
.ghost-button,
.primary-button {
  display: inline-flex;
  min-height: 36px;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  font-size: 14px;
  font-weight: 600;
  line-height: 36px;
  border: 0;
  border-radius: 999px;
  box-shadow: none;
}

.secondary-button::after,
.ghost-button::after,
.primary-button::after {
  border: 0;
}

.secondary-button,
.ghost-button {
  color: #111111;
  background: #f4f4f4;
}

.primary-button {
  color: #ffffff;
  background: #111827;
}

.settings-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 20px;
}

button[disabled] {
  opacity: 0.55;
}

@media (max-width: 760px) {
  .home-page {
    height: 100vh;
    height: 100dvh;
    min-height: 100vh;
    min-height: 100dvh;
    overflow: hidden;
    background: #ffffff;
  }

  .mobile-nav {
    position: fixed;
    top: 0;
    right: 0;
    left: 0;
    z-index: 1200;
    box-sizing: border-box;
    display: block;
    height: var(--mobile-nav-height);
    padding-top: calc(
      var(--mobile-status-height) + var(--mobile-nav-top-offset)
    );
    background: #ffffff;
  }

  .mobile-nav-content {
    position: relative;
    display: flex;
    height: var(--mobile-nav-content-height);
    align-items: center;
    padding: 0 var(--mobile-right-safe-width) 0 24px;
  }

  .mobile-menu-button {
    position: relative;
    z-index: 2;
    display: flex;
    width: 34px;
    height: 34px;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    gap: 5px;
    margin: 0;
    padding: 0;
    background: transparent;
    border: 0;
    border-radius: 0;
    box-shadow: none;
  }

  .mobile-menu-button::after {
    border: 0;
  }

  .mobile-menu-button text {
    display: block;
    width: 22px;
    height: 2px;
    background: #303030;
    border-radius: 999px;
    transition:
      width 0.2s ease,
      opacity 0.2s ease,
      transform 0.24s ease;
    transform-origin: center;
  }

  .mobile-menu-button.open text:nth-child(1) {
    transform: translateY(7px) rotate(45deg);
  }

  .mobile-menu-button.open text:nth-child(2) {
    width: 0;
    opacity: 0;
  }

  .mobile-menu-button.open text:nth-child(3) {
    transform: translateY(-7px) rotate(-45deg);
  }

  .mobile-nav-title {
    position: absolute;
    right: var(--mobile-right-safe-width);
    left: 58px;
    overflow: hidden;
    color: #000000;
    font-size: 17px;
    font-weight: 800;
    line-height: var(--mobile-nav-content-height);
    text-align: center;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .workspace {
    height: 100vh;
    height: 100dvh;
    min-height: 0;
    overflow: hidden;
  }

  .sidebar {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    z-index: 1210;
    box-sizing: border-box;
    display: block;
    width: 246px;
    flex-basis: auto;
    padding: 36px 14px 84px;
    pointer-events: none;
    border-right: 1px solid #edf0f4;
    opacity: 0;
    box-shadow: 0 0 0 rgb(15 23 42 / 0%);
    transform: translate3d(-104%, 0, 0);
    transition:
      transform 0.28s cubic-bezier(0.22, 1, 0.36, 1),
      opacity 0.22s ease,
      box-shadow 0.28s ease;
    will-change: transform, opacity;
  }

  .sidebar.collapsed {
    width: 246px;
    flex-basis: auto;
    padding: calc(var(--mobile-nav-height) + 10px) 14px 84px;
    border-right-color: #edf0f4;
  }

  .mobile-sidebar-mask {
    position: fixed;
    inset: 0;
    z-index: 1190;
    display: block;
    pointer-events: none;
    background: rgb(15 23 42 / 18%);
    opacity: 0;
    transition: opacity 0.24s ease;
  }

  .mobile-sidebar-mask.open {
    pointer-events: auto;
    opacity: 1;
  }

  .sidebar.mobile-open {
    pointer-events: auto;
    opacity: 1;
    box-shadow: 18px 0 45px rgb(15 23 42 / 14%);
    transform: translate3d(0, 0, 0);
  }

  .sidebar.mobile-open .sidebar-content {
    width: 218px;
  }

  .sidebar.mobile-open .new-chat {
    width: 210px;
    height: 44px;
    margin-right: auto;
    margin-left: auto;
    font-size: 16px;
    line-height: 44px;
  }

  .sidebar.mobile-open .chat-list {
    height: calc(100vh - var(--mobile-nav-height) - 206px);
    padding-right: 4px;
    padding-left: 4px;
  }

  .sidebar.mobile-open .company-menu-wrap {
    right: 16px;
    left: 16px;
  }

  .collapse-button {
    display: none;
  }

  .main-panel {
    box-sizing: border-box;
    width: 100vw;
    height: 100vh;
    height: 100dvh;
    padding-top: var(--mobile-nav-height);
    overflow: hidden;
  }

  .hero {
    box-sizing: border-box;
    height: 100%;
    min-height: 0;
    overflow: hidden;
    padding-top: 54px;
  }

  .hero-title {
    display: flex;
    width: calc(100vw - 48px);
    flex-direction: column;
    gap: 18px;
    margin: 0 0 52px;
    color: #303236;
    font-size: 20px;
    line-height: 1.2;
    letter-spacing: 0;
    text-align: center;
    font-weight: 600;
  }

  .hero-title text {
    display: block;
  }

  .feature-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    width: 646rpx;
    gap: 36rpx 40rpx;
  }

  @media (max-height: 720px) {
    .hero {
      padding-top: 34px;
    }

    .hero-title {
      gap: 14px;
      margin-bottom: 34px;
    }

    .feature-grid {
      gap: 28rpx 32rpx;
    }
  }

  .feature-card {
    box-sizing: border-box;
    display: flex;
    width: 100%;
    height: 116rpx;
    align-items: center;
    justify-content: flex-start;
    gap: 12rpx;
    padding: 0 24rpx 0 28rpx;
    overflow: hidden;
    background: #eef4fe;
    border-radius: 999px;
  }

  .feature-visual {
    position: static;
    width: 87rpx;
    height: 66rpx;
    flex: 0 0 87rpx;
    transform: none;
  }

  .feature-svg {
    width: 87rpx;
    height: 66rpx;
  }

  .feature-copy {
    min-width: 0;
    flex: 1;
  }

  .feature-title {
    overflow: hidden;
    margin: 0;
    color: #303236;
    font-size: 28rpx;
    font-style: italic;
    font-weight: 600;
    line-height: 1;
    text-align: left;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .feature-description {
    display: none;
  }

  .message-panel {
    height: calc(100vh - var(--mobile-nav-height) - 154px);
    margin: 16px 12px 0;
    padding: 12px;
  }

  .composer {
    position: fixed;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 1000;
    display: flex;
    width: auto;
    min-width: 0;
    min-height: 116px;
    max-height: min(226px, calc(100vh - var(--mobile-nav-height) - 24px));
    flex-direction: column;
    gap: 10px;
    padding: 0 22px calc(14px + env(safe-area-inset-bottom));
    background: linear-gradient(180deg, rgb(255 255 255 / 0%) 0%, #ffffff 24%);
    border: 0;
    border-radius: 0;
    box-shadow: none;
    transform: none;
  }

  .composer-footer {
    order: 1;
    min-height: 38px;
  }

  .quick-actions {
    width: 100%;
    max-width: 100%;
  }

  .quick-action-row {
    gap: 8px;
  }

  .quick-action,
  .mode-chip {
    height: 34px;
    padding: 0 16px;
    color: #2f333a;
    font-size: 14px;
    line-height: 34px;
    background: #ffffff;
    border: 1px solid #e5e8ee;
    border-radius: 8px;
  }

  .mode-chip {
    color: #1267ff;
    background: #eef4ff;
    border-color: #d8e6ff;
  }

  .quick-action.more {
    padding: 0 16px;
  }

  .plus,
  .tool-divider {
    display: none;
  }

  .composer-attachments {
    order: 2;
    min-height: 50px;
  }

  .composer-attachment {
    width: 224px;
    height: 50px;
  }

  .editor-wrap {
    order: 3;
    box-sizing: border-box;
    min-height: 54px;
    max-height: 136px;
    overflow: hidden;
    padding: 14px 86px 10px 18px;
    background: #ffffff;
    border-radius: 15px;
    box-shadow: 0 14px 32px rgb(15 23 42 / 12%);
  }

  .message-placeholder {
    top: 14px;
    right: 86px;
    left: 18px;
    color: #a6a6a6;
    font-size: 14px;
    line-height: 24px;
  }

  .message-input {
    height: 32px;
    min-height: 30px;
    max-height: 112px;
    overflow-y: auto;
    padding: 0;
    font-size: 14px;
    line-height: 24px;
  }

  .send-button {
    position: absolute;
    right: 72px;
    bottom: calc(24px + env(safe-area-inset-bottom));
    width: 30px;
    height: 30px;
    flex-basis: 30px;
    margin: 0;
    background: transparent;
    box-shadow: none;
  }

  .send-button.is-disabled {
    background: transparent;
  }

  .send-button .uni-icons {
    color: #303030 !important;
  }

  .mobile-attach-button {
    position: absolute;
    right: 40px;
    bottom: calc(25px + env(safe-area-inset-bottom));
    display: inline-flex;
    width: 28px;
    height: 28px;
    align-items: center;
    justify-content: center;
    margin: 0;
    padding: 0;
    background: transparent;
    border: 2px solid #303030;
    border-radius: 50%;
    box-shadow: none;
  }

  .mobile-attach-button::after {
    border: 0;
  }

  .error-text {
    right: 18px;
    bottom: calc(124px + env(safe-area-inset-bottom));
    left: 18px;
  }

  .board-mention-menu {
    max-width: calc(100% - 24px);
  }

  .settings-overlay {
    align-items: stretch;
    justify-content: center;
    padding: 0;
  }

  .feedback-overlay {
    align-items: center;
    padding: 16px;
  }

  .settings-panel {
    display: flex;
    width: 100vw;
    height: 100vh;
    height: 100dvh;
    flex-direction: column;
    border: 0;
    border-radius: 0;
    box-shadow: none;
  }

  .feedback-panel {
    width: calc(100vw - 32px);
    padding: 20px;
  }

  .feedback-textarea {
    height: 220px;
  }

  .settings-nav {
    flex: 0 0 auto;
    flex-direction: row;
    align-items: center;
    gap: 8px;
    padding: calc(
        10px + var(--mobile-status-height) + var(--mobile-nav-top-offset)
      )
      calc(var(--mobile-capsule-safe-right) + 50px) 10px 14px;
    overflow-x: auto;
    border-bottom: 1px solid #eeeeee;
  }

  .settings-close {
    width: 36px;
    height: 36px;
    flex: 0 0 36px;
    margin: 0 4px 0 0;
  }

  .settings-panel-close {
    top: calc(
      10px + var(--mobile-status-height) + var(--mobile-nav-top-offset)
    );
    right: var(--mobile-capsule-safe-right);
    margin: 0;
  }

  .settings-nav-item {
    width: auto;
    height: 36px;
    flex: 0 0 auto;
    gap: 7px;
    padding: 0 12px;
    font-size: 14px;
    line-height: 36px;
    background: #f7f7f7;
    border-radius: 10px;
  }

  .settings-nav-item.active {
    color: #111827;
    background: #eef4ff;
  }

  .settings-nav-icon {
    width: 18px;
    height: 18px;
    flex-basis: 18px;
  }

  .settings-nav-item > text:last-child {
    line-height: 36px;
  }

  .settings-content {
    flex: 1 1 auto;
    height: auto;
    min-height: 0;
  }

  .settings-content-inner {
    padding: 18px 16px calc(24px + env(safe-area-inset-bottom));
  }

  .settings-header {
    align-items: flex-start;
    flex-direction: column;
    gap: 6px;
    padding-bottom: 14px;
  }

  .settings-title {
    font-size: 22px;
    line-height: 1.25;
  }

  .settings-status {
    font-size: 12px;
  }

  .settings-error {
    margin-top: 10px;
  }

  .settings-section {
    padding: 14px 0;
  }

  .account-summary {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .avatar-preview {
    width: 52px;
    height: 52px;
    font-size: 20px;
  }

  .summary-text {
    flex: 1 1 calc(100% - 70px);
  }

  .summary-name {
    font-size: 16px;
  }

  .summary-id {
    font-size: 12px;
  }

  .avatar-actions {
    width: 100%;
    flex: 0 0 100%;
    gap: 8px;
  }

  .avatar-actions .secondary-button,
  .avatar-actions .ghost-button {
    flex: 1 1 0;
    padding: 0 12px;
  }

  .form-row,
  .readonly-row {
    grid-template-columns: 1fr;
    gap: 8px;
    padding: 8px 0;
  }

  .form-row input,
  .readonly-row > text:last-child {
    width: 100%;
    max-width: none;
    justify-self: stretch;
    text-align: left;
  }

  .section-title {
    margin-bottom: 8px;
    font-size: 16px;
  }

  .settings-actions {
    gap: 8px;
    padding-top: 16px;
  }

  .settings-actions .ghost-button,
  .settings-actions .primary-button {
    flex: 1 1 0;
    padding: 0 12px;
  }
}
</style>
