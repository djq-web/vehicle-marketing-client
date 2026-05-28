<template>
  <view class="home-page" :style="homePageStyle">
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
    <view class="top-strip"></view>
    <view class="workspace">
      <view
        class="sidebar"
        :class="{ collapsed: isSidebarCollapsed, 'mobile-open': isMobileSidebarOpen }"
      >
        <view v-if="!isSidebarCollapsed" class="sidebar-content">
          <view class="brand-mark">
            <view class="brand-circle">肆</view>
          </view>

          <button class="new-chat" :disabled="isBusy" @click="createSession">
            <view class="button-icon"></view>
            <text>创建新对话</text>
          </button>

          <scroll-view class="chat-list" scroll-y>
            <template v-for="chat in sessionChats" :key="chat.id">
              <text v-if="chat.date" class="date-label">{{ chat.date }}</text>
              <button
                class="chat-item"
                :class="{ active: chat.active }"
                @click="selectSession(chat.id)"
              >
                <text>{{ chat.title }}</text>
              </button>
            </template>

            <template v-if="!sessionChats.length">
              <template
                v-for="(item, index) in fallbackChats"
                :key="`${item.title}-${index}`"
              >
                <text v-if="item.date" class="date-label">{{ item.date }}</text>
                <view class="chat-item" :class="{ active: item.active }">
                  <text>{{ item.title }}</text>
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
            <text class="avatar">
              <image v-if="settingsForm.avatarUrl" :src="settingsForm.avatarUrl" mode="aspectFill" />
              <text v-else>{{ avatarInitial }}</text>
            </text>
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
          <image class="collapse-icon" src="/static/svg/expandIcon.svg" mode="aspectFit" />
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
              :class="{ mine: message.role === 'USER' }"
            >
              <view class="message-bubble">
                <text class="message-content">{{ message.content }}</text>
                <StrategyMessageCard
                  v-if="message.metadata?.card"
                  :metadata="message.metadata"
                  :actions-disabled="isBusy"
                  @action="handleCardAction"
                />
                <text class="message-time">{{ formatTime(message.createdAt) }}</text>
              </view>
            </view>

            <view v-if="isBusy" class="assistant-loading">
              {{ chatStore.uploading ? "正在上传并解析资料" : "正在处理" }}
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
              v-for="feature in features"
              :key="feature.title"
              class="feature-card"
              @click="handleFeatureSelect(feature)"
            >
              <view class="feature-visual">
                <image class="feature-svg" :src="feature.icon" mode="aspectFit" />
              </view>
              <view class="feature-copy">
                <text class="feature-title">{{ feature.title }}</text>
                <text class="feature-description">{{ feature.description }}</text>
              </view>
            </button>
          </view>
        </view>

        <text v-if="strategyNotice" class="error-text">{{ strategyNotice }}</text>

        <view
          v-if="isBoardMenuVisible"
          class="board-mention-menu"
          :style="boardMenuStyle"
        >
          <text class="board-menu-title">选择看板</text>
          <scroll-view class="board-menu-list" scroll-y>
            <button
              v-for="board in filteredBoards"
              :key="board.id"
              class="board-option"
              @click="selectBoard(board)"
            >
              <text class="board-icon">
                <image :src="board.icon" mode="aspectFit" />
              </text>
              <view class="board-copy">
                <view class="board-name-row">
                  <text class="board-name">{{ board.name }}</text>
                  <text class="board-alias">@{{ board.mention }}</text>
                </view>
                <text class="board-description">{{ board.description }}</text>
              </view>
            </button>
          </scroll-view>
        </view>

        <view class="composer">
          <view class="editor-wrap">
            <text v-if="!draft" class="message-placeholder">
              {{ composerPlaceholder }}
            </text>
            <textarea
              v-model="draft"
              class="message-input"
              auto-height
              :disabled="isBusy"
              :maxlength="-1"
              @blur="handleEditorBlur"
              @confirm="sendMessage"
              @focus="handleEditorFocus"
              @input="handleDraftInput"
              @keydown="handleEditorKeydown"
              @tap="handleEditorPointerEnd"
            />
          </view>

          <view class="composer-footer">
            <scroll-view class="quick-actions" scroll-x>
              <view class="quick-action-row">
                <button class="plus" :disabled="isBusy" @click="chooseMaterial">
                  <uni-icons type="plusempty" size="18" color="#111827" />
                </button>
                <view class="tool-divider"></view>
                <button
                  v-if="activeComposerModeMeta"
                  class="mode-chip"
                  :disabled="isBusy"
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
                <button
                  class="quick-action more"
                  :class="{ active: isMoreMenuVisible }"
                  :disabled="isBusy"
                  @click="toggleMoreMenu"
                >
                  <text>更多</text>
                </button>
              </view>
            </scroll-view>
            <button
              class="send-button"
              :class="{ 'is-disabled': isBusy || !draft.trim() }"
              :disabled="isBusy || !draft.trim()"
              @click="sendMessage"
            >
              <uni-icons type="arrow-up" size="17" color="#ffffff" />
            </button>
            <button
              class="mobile-attach-button"
              :disabled="isBusy"
              @click="chooseMaterial"
            >
              <uni-icons type="plusempty" size="20" color="#303030" />
            </button>
          </view>

          <view v-if="isMoreMenuVisible" class="composer-more-menu">
            <button
              v-for="item in moreActions"
              :key="item.label"
              class="more-menu-item"
              @click="handleMoreAction(item)"
            >
              <view>
                <text>{{ item.label }}</text>
                <text>{{ item.description }}</text>
              </view>
            </button>
          </view>
        </view>
      </view>
    </view>

    <view v-if="isSettingsVisible" class="settings-overlay" @click="closeSettings">
      <view class="settings-panel" @click.stop>
        <view class="settings-nav">
          <button class="settings-close" @click="closeSettings">
            <text class="close-icon"></text>
          </button>
          <button class="settings-nav-item active">
            <text class="settings-nav-icon"></text>
            <text>账号设置</text>
          </button>
        </view>

        <scroll-view class="settings-content" scroll-y>
          <view class="settings-content-inner">
            <view class="settings-header">
              <text class="settings-title">账户</text>
              <text v-if="settingsLoading" class="settings-status">正在同步账号信息</text>
            </view>

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
                <text class="summary-name">{{ settingsForm.nickname || displayName }}</text>
                <text class="summary-email">{{ userEmail || "未绑定邮箱" }}</text>
              </view>
              <button class="secondary-button" @click="chooseAvatar">更换头像</button>
            </view>

            <view class="settings-section">
              <view class="form-row">
                <text>昵称</text>
                <input v-model.trim="settingsForm.nickname" placeholder="请输入昵称" />
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
              <text class="section-title">修改密码</text>
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
              <button class="ghost-button" @click="resetSettingsForm">重置</button>
              <button class="primary-button" @click="saveSettings">保存设置</button>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from "@dcloudio/uni-app";
import { computed, nextTick, reactive, ref, watch } from "vue";
import { request } from "@/services/api";
import { useAuthStore } from "@/stores/auth";
import { useStrategyChatStore } from "@/stores/strategyChat";
import type { LoginResponse } from "@/types/strategy";
import StrategyMessageCard from "./components/StrategyMessageCard.vue";

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
  searchText: string;
};

type QuickActionBase = {
  label: string;
  interactive?: boolean;
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

type ComposerModeId = "strategy";

type ComposerMode = {
  id: ComposerModeId;
  label: string;
  placeholder: string;
};

type MoreAction = {
  label: string;
  description: string;
};

type PickedFile = {
  path?: string;
  tempFilePath?: string;
  name?: string;
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
type MeContext = {
  user?: AuthUser & {
    loginName?: string;
    departmentName?: string;
    organizationName?: string;
  };
  tenant?: {
    id?: string;
    name?: string;
  } | null;
  roles?: Array<{
    id?: string;
    name?: string;
  }>;
};

type LocalSettings = {
  avatarUrl: string;
  nickname: string;
  phone: string;
};

const LOCAL_SETTINGS_KEY = "vehicle_marketing_client_account_settings";
const STRATEGY_AGENT_CODE = "strategy_agent";

const authStore = useAuthStore();
const chatStore = useStrategyChatStore();
const pageLoading = ref(false);
const isSidebarCollapsed = ref(false);
const isCompanyMenuVisible = ref(false);
const isSettingsVisible = ref(false);
const isBoardMenuVisible = ref(false);
const isMoreMenuVisible = ref(false);
const isMobileSidebarOpen = ref(false);
const activeComposerMode = ref<ComposerModeId | null>(null);
const mobileStatusBarHeight = ref(0);
const mobileNavHeight = ref(56);
const mobileNavContentHeight = ref(44);
const mobileRightSafeWidth = ref(58);
const boardMenuQuery = ref("");
const boardMenuTrigger = ref<BoardTrigger | null>(null);
const boardMenuStyle = ref("left:16px;top:96px;width:320px;");
const editorCursor = ref(0);
const boardMenuCloseTimer = ref<ReturnType<typeof setTimeout> | null>(null);
const draft = ref("");
const messageScrollTop = ref(0);
const settingsLoading = ref(false);
const meContext = ref<MeContext | null>(null);
const settingsForm = reactive({
  avatarUrl: "",
  nickname: "",
  phone: "",
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
});

const iconMap = {
  brandStrategy: "/static/svg/brand-strategy.svg",
  keyMetrics: "/static/svg/key-metrics.svg",
  marketingOperations: "/static/svg/marketing-operations.svg",
  marketingCalendar: "/static/svg/marketing-calendar.svg",
  marketFeedback: "/static/svg/market-feedback.svg",
  ecologicalPartner: "/static/svg/ecological-partner.svg",
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

const fallbackChats = [
  { date: "最近会话", title: "新的聊天", active: true },
  { date: "", title: "新的聊天" },
  { date: "", title: "新的聊天" },
  { date: "", title: "新的聊天" },
  { date: "", title: "新的聊天" },
  { date: "", title: "新的聊天" },
  { date: "", title: "新的聊天" },
];

const quickActions: QuickAction[] = [
  { label: "/ 看板", type: "board" },
  { label: "/ 任务管理", type: "prompt", prompt: "创建任务管理计划", interactive: false },
  { label: "/ 战略诊断", type: "mode", mode: "strategy" },
  { label: "/ 战略拆解", type: "prompt", prompt: "生成19点战略框架", strategy: true, interactive: false },
  { label: "/ 上传素材", type: "upload", interactive: false },
  { label: "/ 图文营销", type: "prompt", prompt: "生成图文营销方案", interactive: false },
];

const strategyModeActions: QuickAction[] = [
  { label: "/ 上传资料", type: "upload", interactive: false },
  { label: "/ 战略拆解", type: "prompt", prompt: "生成19点战略框架", strategy: true, interactive: false },
  { label: "/ 生成报告", type: "prompt", prompt: "生成全部7份战略报告", strategy: true },
  { label: "/ 打开看板", type: "prompt", prompt: "打开品牌战略看板", strategy: true },
];

const composerModes: Record<ComposerModeId, ComposerMode> = {
  strategy: {
    id: "strategy",
    label: "战略诊断",
    placeholder: "描述企业现状或你想诊断的战略方向",
  },
};

const moreActions: MoreAction[] = [
  {
    label: "PPT 生成",
    description: "把当前方案整理为演示稿",
  },
  {
    label: "AI 表格",
    description: "生成结构化计划和指标表",
  },
  {
    label: "图像生成",
    description: "生成营销图片和视觉素材",
  },
  {
    label: "超能模式",
    description: "更深度的策略推理模式",
  },
];

const boardOptions: BoardOption[] = ([
  {
    id: "brand-strategy",
    name: "品牌战略看板",
    mention: "品牌战略",
    description: "锚定方向，塑造品牌心智",
    icon: iconMap.brandStrategy,
  },
  {
    id: "key-metrics",
    name: "核心指标看板",
    mention: "核心指标",
    description: "数据驱动业务增长",
    icon: iconMap.keyMetrics,
  },
  {
    id: "marketing-operations",
    name: "营销运营看板",
    mention: "营销运营",
    description: "全链路营销提效增长",
    icon: iconMap.marketingOperations,
  },
  {
    id: "marketing-calendar",
    name: "营销日历看板",
    mention: "营销日历",
    description: "精准把控营销节点",
    icon: iconMap.marketingCalendar,
  },
  {
    id: "market-feedback",
    name: "市场反馈看板",
    mention: "市场反馈",
    description: "倾听用户优化策略",
    icon: iconMap.marketFeedback,
  },
  {
    id: "ecological-partner",
    name: "生态伙伴看板",
    mention: "生态伙伴",
    description: "携手同行共建生态",
    icon: iconMap.ecologicalPartner,
  },
] satisfies Array<Omit<BoardOption, "searchText">>).map((board) => ({
  ...board,
  searchText: [board.id, board.name, board.mention, board.description]
    .join(" ")
    .toLowerCase()
    .replace(/[\s-]+/g, ""),
}));

const settingItems = [
  { label: "设置", action: "settings" },
  { label: "管理后台", action: "admin" },
  { label: "车肆官网", action: "site" },
  { label: "问题反馈", action: "feedback" },
  { label: "退出登录", action: "logout" },
] as const;

const actionPrompts: Record<string, string> = {
  start_diagnosis: "开始战略诊断",
  provide_info: "我想补充企业信息",
  view_files: "查看当前资料",
  generate_form: "生成战略分析表单",
  confirm_form: "确认",
  generate_framework: "生成19点战略框架",
  refine_framework: "请基于当前19点战略框架生成需要继续追问的问题",
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
  rediagnose: "重新诊断",
  confirm_framework_update: "确认修改",
  cancel_framework_update: "取消修改",
  continue_refine_framework: "继续完善19点战略框架",
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
  () => pageLoading.value || chatStore.loading || chatStore.uploading,
);
const showMessages = computed(() => chatStore.messages.length > 0);
const strategyNotice = computed(
  () => chatStore.error || chatStore.unavailableReason,
);
const companyName = computed(
  () => settingsForm.nickname || authStore.user?.nickname || authStore.user?.tenantId || "车肆企业空间",
);
const settingsUser = computed(() => meContext.value?.user ?? authStore.user);
const displayName = computed(
  () =>
    settingsUser.value?.name ||
    settingsUser.value?.loginName ||
    settingsUser.value?.email ||
    "未命名用户",
);
const userEmail = computed(() => settingsUser.value?.email || "");
const avatarInitial = computed(() => {
  const source = settingsForm.nickname || displayName.value || "车";
  return source.slice(0, 1).toUpperCase();
});
const tenantName = computed(
  () => meContext.value?.tenant?.name || authStore.user?.tenantId || "暂未绑定企业",
);
const roleText = computed(() => {
  const roleNames = (meContext.value?.roles ?? [])
    .map((role) => role.name)
    .filter((name): name is string => Boolean(name));

  if (roleNames.length > 0) {
    return roleNames.join("、");
  }

  if (settingsUser.value?.isTenantSuperAdmin) {
    return "企业超级管理员";
  }

  if (settingsUser.value?.role === "ADMIN") {
    return "系统管理员";
  }

  return "普通成员";
});
const organizationText = computed(
  () => settingsUser.value?.organizationName || settingsUser.value?.departmentName || "暂未设置",
);
const sessionChats = computed(() =>
  chatStore.sessions.map((session, index) => ({
    id: session.id,
    date: index === 0 ? "最近会话" : "",
    title:
      session.title ||
      (session.agentCode === "strategy_agent" ? "品牌战略诊断" : "新的聊天"),
    preview: session.lastMessage?.content || "",
    active: session.id === chatStore.sessionId,
  })),
);
const filteredBoards = computed(() => {
  const query = boardMenuQuery.value.trim().toLowerCase().replace(/[\s-]+/g, "");
  if (!query) {
    return boardOptions;
  }

  return boardOptions.filter((board) => board.searchText.includes(query));
});
const homePageStyle = computed(
  () =>
    ({
      "--mobile-status-height": `${mobileStatusBarHeight.value}px`,
      "--mobile-nav-height": `${mobileNavHeight.value}px`,
      "--mobile-nav-content-height": `${mobileNavContentHeight.value}px`,
      "--mobile-right-safe-width": `${mobileRightSafeWidth.value}px`,
    }) as Record<string, string>,
);
const activeComposerModeMeta = computed(() =>
  activeComposerMode.value ? composerModes[activeComposerMode.value] : null,
);
const composerPlaceholder = computed(
  () => activeComposerModeMeta.value?.placeholder || "发消息...",
);
const visibleQuickActions = computed(() =>
  activeComposerMode.value === "strategy" ? strategyModeActions : quickActions,
);
const isStrategyComposerMode = computed(
  () => activeComposerMode.value === "strategy",
);

onLoad(async () => {
  initMobileChrome();
  authStore.restore();
  applyLocalSettings();

  if (!authStore.isAuthenticated) {
    uni.reLaunch({
      url: "/pages/login/index",
    });
    return;
  }

  await refresh();
});

watch(draft, () => {
  editorCursor.value = clampCursor(editorCursor.value);
  updateBoardMenu();
});

watch(
  () => [chatStore.messages.length, chatStore.loading, chatStore.uploading],
  () => {
    scrollToBottom();
  },
);

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

function toggleCompanyMenu() {
  isCompanyMenuVisible.value = !isCompanyMenuVisible.value;
}

function handleSettingClick(action: (typeof settingItems)[number]["action"]) {
  if (action === "settings") {
    openSettings();
    return;
  }

  if (action === "logout") {
    authStore.logout();
    return;
  }

  uni.showToast({
    title: "暂未开放",
    icon: "none",
  });
  isCompanyMenuVisible.value = false;
}

function readLocalSettings(): LocalSettings {
  try {
    const raw = uni.getStorageSync(LOCAL_SETTINGS_KEY);
    const parsed =
      typeof raw === "string" && raw
        ? (JSON.parse(raw) as Partial<LocalSettings>)
        : (raw as Partial<LocalSettings> | undefined) ?? {};

    return {
      avatarUrl: parsed.avatarUrl || authStore.user?.avatarUrl || "",
      nickname: parsed.nickname || authStore.user?.nickname || authStore.user?.name || "",
      phone: parsed.phone || authStore.user?.phone || "",
    };
  } catch {
    return {
      avatarUrl: authStore.user?.avatarUrl || "",
      nickname: authStore.user?.nickname || authStore.user?.name || "",
      phone: authStore.user?.phone || "",
    };
  }
}

function applyLocalSettings() {
  const settings = readLocalSettings();
  settingsForm.avatarUrl = settings.avatarUrl;
  settingsForm.nickname = settings.nickname;
  settingsForm.phone = settings.phone;
  settingsForm.currentPassword = "";
  settingsForm.newPassword = "";
  settingsForm.confirmPassword = "";
}

async function fetchMe() {
  settingsLoading.value = true;

  try {
    meContext.value = await request<MeContext>("/me");
  } catch {
    meContext.value = null;
  } finally {
    settingsLoading.value = false;
  }
}

function openSettings() {
  isCompanyMenuVisible.value = false;
  isSettingsVisible.value = true;
  applyLocalSettings();
  fetchMe();
}

function closeSettings() {
  isSettingsVisible.value = false;
}

function resetSettingsForm() {
  applyLocalSettings();
}

function chooseAvatar() {
  uni.chooseImage({
    count: 1,
    sizeType: ["compressed"],
    sourceType: ["album", "camera"],
    success: (res) => {
      settingsForm.avatarUrl = res.tempFilePaths[0] || "";
    },
  });
}

function saveSettings() {
  const hasPasswordInput = Boolean(
    settingsForm.currentPassword ||
      settingsForm.newPassword ||
      settingsForm.confirmPassword,
  );

  if (hasPasswordInput) {
    if (
      !settingsForm.currentPassword ||
      !settingsForm.newPassword ||
      !settingsForm.confirmPassword
    ) {
      uni.showToast({
        title: "请完整填写密码修改信息",
        icon: "none",
      });
      return;
    }

    if (settingsForm.newPassword.length < 6) {
      uni.showToast({
        title: "新密码至少需要 6 位",
        icon: "none",
      });
      return;
    }

    if (settingsForm.newPassword !== settingsForm.confirmPassword) {
      uni.showToast({
        title: "两次输入的新密码不一致",
        icon: "none",
      });
      return;
    }
  }

  const settings: LocalSettings = {
    avatarUrl: settingsForm.avatarUrl,
    nickname: settingsForm.nickname,
    phone: settingsForm.phone,
  };
  uni.setStorageSync(LOCAL_SETTINGS_KEY, JSON.stringify(settings));
  authStore.patchLocalUser(settings);
  settingsForm.currentPassword = "";
  settingsForm.newPassword = "";
  settingsForm.confirmPassword = "";
  uni.showToast({
    title: "账号设置已保存",
    icon: "success",
  });
  closeSettings();
}

async function refresh() {
  pageLoading.value = true;

  try {
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
  try {
    await chatStore.createSession();
    activeComposerMode.value = null;
    closeMobileSidebar();
    await scrollToBottom();
  } catch (err) {
    showError(err, "创建会话失败");
  }
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

async function handleFeatureSelect(feature: Feature) {
  if (feature.action === "strategy-chat") {
    try {
      await chatStore.enterStrategy();
      activeComposerMode.value = "strategy";
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
  activeComposerMode.value = null;
  closeMoreMenu();
}

function enterComposerMode(mode: ComposerModeId) {
  activeComposerMode.value = mode;
}

function syncComposerModeWithCurrentSession() {
  activeComposerMode.value =
    chatStore.activeAgentCode === STRATEGY_AGENT_CODE ? "strategy" : null;
}

function toggleMoreMenu() {
  clearBoardMenuCloseTimer();
  closeBoardMenu();
  isMoreMenuVisible.value = !isMoreMenuVisible.value;
}

function closeMoreMenu() {
  isMoreMenuVisible.value = false;
}

function handleMoreAction(item: MoreAction) {
  closeMoreMenu();
  uni.showToast({
    title: `${item.label} 暂未接入`,
    icon: "none",
  });
}

async function handleCardAction(
  action: string,
  payload?: Record<string, unknown>,
) {
  if (isBusy.value) {
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
        await chatStore.openReport(reportType, { diagnosisId });
        syncComposerModeWithCurrentSession();
        await scrollToBottom();
      } catch (err) {
        showError(err, "读取报告失败");
      }
    }
    return;
  }

  const mappedReportType = reportActionTypes[action];

  if (mappedReportType) {
    try {
      await chatStore.openReport(mappedReportType);
      syncComposerModeWithCurrentSession();
      await scrollToBottom();
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

function handleDraftInput(event: Event) {
  const detail = (event as Event & {
    detail?: {
      value?: string;
      cursor?: number;
    };
  }).detail;
  const value = detail?.value ?? draft.value;
  draft.value = value;
  editorCursor.value =
    typeof detail?.cursor === "number"
      ? clampCursor(detail.cursor)
      : clampCursor(value.length);
  updateBoardMenu();
}

function handleEditorFocus() {
  closeMoreMenu();
  clearBoardMenuCloseTimer();
  syncNativeTextareaCursor();
  updateBoardMenu();
}

function handleEditorBlur() {
  clearBoardMenuCloseTimer();
  boardMenuCloseTimer.value = setTimeout(() => {
    closeBoardMenu();
  }, 120);
}

function handleEditorPointerEnd() {
  setTimeout(() => {
    syncNativeTextareaCursor();
    updateBoardMenu();
  }, 0);
}

function handleEditorKeydown(event: KeyboardEvent) {
  if (event.key !== "Enter" || event.shiftKey || event.isComposing) {
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

  if (isBusy.value) {
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
    .select(".editor-wrap")
    .boundingClientRect()
    .exec((results) => {
      const mainRect = normalizeRect(results?.[0]);
      const editorRect = normalizeRect(results?.[1]);

      if (!mainRect || !editorRect) {
        boardMenuStyle.value = "left:16px;top:96px;width:320px;";
        return;
      }

      const systemInfo = uni.getSystemInfoSync();
      const viewportHeight = systemInfo.windowHeight || mainRect.bottom;
      const menuWidth = Math.min(352, Math.max(288, mainRect.width - 32));
      const estimatedMenuHeight = Math.min(
        408,
        37 + Math.max(1, filteredBoards.value.length) * 62,
      );
      const caret = estimateCaretOffset(editorRect.width);
      const caretLeft = editorRect.left + caret.x;
      const caretTop = editorRect.top + caret.y;
      const spaceBelow = viewportHeight - (caretTop + caret.lineHeight);
      const left = Math.min(
        Math.max(16, caretLeft - mainRect.left - 12),
        Math.max(16, mainRect.width - menuWidth - 16),
      );
      const top =
        spaceBelow >= Math.min(estimatedMenuHeight, 220)
          ? caretTop - mainRect.top + caret.lineHeight + 8
          : Math.max(16, caretTop - mainRect.top - estimatedMenuHeight - 8);

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
    if (strategy || isStrategyComposerMode.value) {
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
  if (!content || isBusy.value) {
    return;
  }

  draft.value = "";
  closeBoardMenu();
  closeMoreMenu();

  try {
    if (isStrategyComposerMode.value) {
      await chatStore.sendStrategy(content);
    } else {
      await chatStore.sendBase(content);
    }
    syncComposerModeWithCurrentSession();
    await scrollToBottom();
  } catch (err) {
    draft.value = content;
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
  mobileNavHeight.value = statusBarHeight + 56;
  mobileRightSafeWidth.value = 58;

  // #ifdef MP-WEIXIN
  const menuButton = uni.getMenuButtonBoundingClientRect();
  const topGap = Math.max(0, menuButton.top - statusBarHeight);
  const bottomGap = topGap || 6;

  mobileNavContentHeight.value = menuButton.height;
  mobileNavHeight.value = menuButton.bottom + bottomGap;
  mobileRightSafeWidth.value =
    Math.max(88, systemInfo.windowWidth - menuButton.left) + 12;
  // #endif
}

function chooseMaterial() {
  if (isBusy.value) {
    return;
  }

  closeMoreMenu();
  const supportedExtensions = [
    "pdf",
    "txt",
    "md",
    "markdown",
    "csv",
    "json",
    "jpg",
    "jpeg",
    "png",
    "webp",
    "bmp",
    "gif",
  ];

  // #ifdef MP-WEIXIN
  uni.chooseMessageFile({
    count: 1,
    type: "all",
    success: (res) => {
      const file = res.tempFiles[0] as PickedFile | undefined;
      uploadPickedFile(file);
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
      extension: supportedExtensions,
      success: (res) => uploadPickedFile(res.tempFiles[0]),
    });
    return;
  }
  // #endif

  uni.showToast({
    title: "当前端暂不支持文件选择",
    icon: "none",
  });
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

async function scrollToBottom() {
  await nextTick();
  messageScrollTop.value += 100000;
}

function formatTime(value: string) {
  const date = new Date(value);
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${hours}:${minutes}`;
}

function showError(err: unknown, fallback: string) {
  uni.showToast({
    title: err instanceof Error ? err.message : fallback,
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
}

.mobile-nav,
.mobile-sidebar-mask,
.mobile-attach-button {
  display: none;
}

.top-strip {
  height: 36px;
  background: #bfbfbf;
}

.workspace {
  display: flex;
  height: calc(100vh - 36px);
  min-height: calc(100vh - 36px);
  overflow: hidden;
}

.sidebar {
  position: relative;
  width: 188px;
  flex: 0 0 188px;
  padding: 12px 11px 88px;
  overflow: hidden;
  background: linear-gradient(180deg, #f6f7f9 0%, #f2f4f7 100%);
  border-right: 1px solid #edf0f4;
  transition: width 0.22s ease, flex-basis 0.22s ease, padding 0.22s ease;
}

.sidebar.collapsed {
  width: 0;
  flex-basis: 0;
  padding-right: 0;
  padding-left: 0;
  border-right-color: transparent;
}

.sidebar-content {
  width: 166px;
}

.brand-mark {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
}

.brand-circle {
  position: relative;
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  color: #111111;
  font-weight: 800;
  border: 1.5px solid #121212;
  border-radius: 50%;
  transform: rotate(-18deg);
}

.brand-circle::before,
.brand-circle::after {
  position: absolute;
  width: 48px;
  height: 1px;
  content: "";
  background: #111111;
}

.brand-circle::before {
  transform: rotate(35deg);
}

.brand-circle::after {
  transform: rotate(-52deg);
}

.new-chat {
  display: flex;
  width: 162px;
  height: 26px;
  align-items: center;
  justify-content: center;
  gap: 5px;
  margin: 0 auto 13px;
  color: #1167ff;
  font-size: 12px;
  font-weight: 700;
  line-height: 26px;
  background: #ffffff;
  border: 1px solid #e2e7ef;
  border-radius: 999px;
  box-shadow: 0 2px 7px rgb(25 40 78 / 10%);
  overflow: hidden;
  padding: 0;
}

.new-chat::after,
.chat-item::after,
.company::after,
.setting-item::after,
.collapse-button::after,
.feature-card::after,
.quick-action::after,
.plus::after,
.send-button::after,
.board-option::after {
  border: 0;
}

.button-icon {
  position: relative;
  width: 13px;
  height: 13px;
}

.button-icon::before {
  position: absolute;
  top: 6px;
  left: 2px;
  width: 9px;
  height: 2px;
  content: "";
  background: #1167ff;
  border-radius: 2px;
  transform: rotate(-32deg);
}

.button-icon::after {
  position: absolute;
  top: 3px;
  right: 1px;
  width: 3px;
  height: 3px;
  content: "";
  background: #1167ff;
  border-radius: 1px;
  transform: rotate(-32deg);
}

.chat-list {
  height: calc(100vh - 258px);
  overflow: hidden;
  font-size: 11px;
}

.date-label {
  display: block;
  margin: 12px 5px 6px;
  color: #a1a8b2;
  font-size: 9px;
}

.chat-item {
  display: flex;
  width: 100%;
  height: 25px;
  align-items: center;
  justify-content: space-between;
  padding: 0 7px;
  color: #252a33;
  font-size: 11px;
  line-height: 25px;
  text-align: left;
  background: transparent;
  border: 0;
  border-radius: 7px;
  box-shadow: none;
}

.chat-item text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-item.active {
  font-weight: 700;
  background: #ffffff;
  box-shadow: inset 0 0 0 1px #e8ecf2;
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
  width: 112px;
  padding: 6px;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 8px 22px rgb(28 43 74 / 13%);
}

.setting-item {
  display: flex;
  width: 100%;
  height: 27px;
  align-items: center;
  gap: 8px;
  padding: 0 9px;
  color: #2f3540;
  font-size: 10px;
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

.setting-icon.admin::before,
.setting-icon.site::before {
  inset: 2px;
  border: 1px solid #596579;
  background: transparent;
  border-radius: 2px;
}

.setting-icon.admin::after {
  right: 3px;
  bottom: 3px;
  left: 3px;
  height: 2px;
}

.setting-icon.site::after {
  top: 6px;
  right: 2px;
  left: 2px;
  height: 1px;
}

.setting-icon.feedback::before {
  top: 1px;
  left: 4px;
  width: 5px;
  height: 7px;
  border: 1px solid #596579;
  border-bottom: 0;
  background: transparent;
  border-radius: 6px 6px 0 0;
}

.setting-icon.feedback::after {
  bottom: 1px;
  left: 6px;
  width: 2px;
  height: 2px;
  border-radius: 50%;
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
  font-size: 11px;
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
  padding-bottom: 156px;
  background: #ffffff;
}

.collapse-button {
  position: absolute;
  top: 13px;
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
  box-shadow: 0 0 0 1px #cfe3ff, 0 5px 14px rgb(43 133 255 / 22%);
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
  margin: 46px 26px 0;
  padding: 18px;
  overflow: hidden;
  background: #f7f9fc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  width: initial;
}

.message-stream {
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
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
}

.message-bubble {
  box-sizing: border-box;
  min-width: 0;
  max-width: min(760px, 82%);
  overflow: hidden;
  padding: 12px 14px 10px;
  background: #ffffff;
  border: 1px solid #e4eaf2;
  border-radius: 8px;
  box-shadow: 0 4px 14px rgb(31 45 61 / 5%);
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
  position: absolute;
  right: 16%;
  bottom: 110px;
  left: 16%;
  margin: 0;
  color: #d93025;
  font-size: 12px;
}

.composer {
  position: absolute;
  right: auto;
  bottom: 27px;
  left: 50%;
  width: 68%;
  max-width: 1080px;
  min-width: 720px;
  min-height: 82px;
  padding: 12px 12px 10px 18px;
  background: #ffffff;
  border: 1px solid #a9c7ff;
  border-radius: 22px;
  box-shadow: 0 0 0 1px rgb(31 126 255 / 4%), 0 10px 28px rgb(42 103 255 / 12%);
  transform: translateX(-50%);
}

.editor-wrap {
  position: relative;
  min-height: 32px;
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
  width: 100%;
  min-height: 32px;
  max-height: 88px;
  padding: 0 12px 0 0;
  color: #1f2733;
  font-size: 14px;
  line-height: 22px;
  background: transparent;
}

.composer-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
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
  box-shadow: 0 4px 0 currentColor, 0 8px 0 currentColor;
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
  background: linear-gradient(135deg, transparent 42%, currentColor 43% 58%, transparent 59%);
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

.composer-more-menu {
  position: absolute;
  right: 48px;
  bottom: 48px;
  z-index: 30;
  width: 222px;
  padding: 8px;
  background: #ffffff;
  border: 1px solid #e6ecf5;
  border-radius: 14px;
  box-shadow: 0 18px 45px rgb(31 45 61 / 18%);
}

.more-menu-item {
  display: flex;
  width: 100%;
  height: 52px;
  align-items: center;
  gap: 10px;
  margin: 0;
  padding: 0 10px;
  color: #182030;
  text-align: left;
  background: transparent;
  border: 0;
  border-radius: 10px;
  box-shadow: none;
}

.more-menu-item::after {
  border: 0;
}

.more-menu-item:active {
  background: #f3f6fb;
}

.more-menu-item view {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.more-menu-item view text:first-child {
  color: #182030;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.3;
}

.more-menu-item view text:last-child {
  overflow: hidden;
  color: #8792a3;
  font-size: 11px;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  box-shadow: 0 16px 44px rgb(24 55 105 / 18%), 0 0 0 1px rgb(18 103 255 / 4%);
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
}

.board-option:active {
  background: #f2f7ff;
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

.settings-panel {
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
  border-radius: 12px;
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

.settings-nav-icon::before {
  position: absolute;
  top: 3px;
  left: 6px;
  width: 8px;
  height: 8px;
  content: "";
  border: 2px solid #181818;
  border-radius: 50%;
}

.settings-nav-icon::after {
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
  padding: 28px 64px 34px 16px;
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

.settings-section {
  padding: 20px 0;
  border-bottom: 1px solid #ebebeb;
}

.account-summary {
  display: flex;
  align-items: center;
  gap: 14px;
}

.avatar-preview {
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

.summary-name {
  display: block;
  overflow: hidden;
  color: #151515;
  font-size: 17px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.summary-email {
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
  border-radius: 999px;
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
    padding-top: var(--mobile-status-height);
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
    transition: width 0.2s ease, opacity 0.2s ease, transform 0.24s ease;
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

  .top-strip {
    display: none;
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
    padding: calc(var(--mobile-nav-height) + 10px) 14px 84px;
    pointer-events: none;
    border-right: 1px solid #edf0f4;
    opacity: 0;
    box-shadow: 0 0 0 rgb(15 23 42 / 0%);
    transform: translate3d(-104%, 0, 0);
    transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1),
      opacity 0.22s ease, box-shadow 0.28s ease;
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
    height: 32px;
    font-size: 13px;
    line-height: 32px;
  }

  .sidebar.mobile-open .chat-list {
    height: calc(100vh - var(--mobile-nav-height) - 190px);
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
    padding-bottom: 148px;
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
    font-size: 24px;
    line-height: 1.2;
    letter-spacing: 0;
    text-align: center;
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
    width: 116rpx;
    height: 88rpx;
    flex: 0 0 116rpx;
    transform: none;
  }

  .feature-svg {
    width: 116rpx;
    height: 88rpx;
  }

  .feature-copy {
    min-width: 0;
    flex: 1;
  }

  .feature-title {
    overflow: hidden;
    margin: 0;
    color: #303236;
    font-size: 36rpx;
    font-style: italic;
    font-weight: 900;
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

  .editor-wrap {
    order: 2;
    box-sizing: border-box;
    min-height: 54px;
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
    min-height: 30px;
    max-height: 84px;
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

  .composer-more-menu {
    right: 22px;
    bottom: calc(104px + env(safe-area-inset-bottom));
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
    padding: 16px;
  }

  .settings-panel {
    grid-template-columns: 128px minmax(0, 1fr);
    width: calc(100vw - 32px);
    height: calc(100vh - 32px);
  }

  .settings-nav {
    padding: 22px 14px;
  }

  .settings-content-inner {
    padding-right: 24px;
  }

  .form-row,
  .readonly-row {
    grid-template-columns: 1fr;
    gap: 8px;
    padding: 8px 0;
  }

  .form-row input,
  .readonly-row > text:last-child {
    text-align: left;
  }
}
</style>
