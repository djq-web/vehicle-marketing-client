<template>
  <div class="home-page">
    <div class="top-strip"></div>
    <div class="workspace">
      <AppSidebar
        :chats="sessionChats"
        :collapsed="isSidebarCollapsed"
        :company-name="companyName"
        @create-chat="handleCreateSession"
        @select-chat="handleSelectSession"
        @open-settings="isSettingsVisible = true"
      />
      <main class="main-panel">
        <button
          class="collapse-button"
          type="button"
          :class="{ collapsed: isSidebarCollapsed }"
          :aria-label="isSidebarCollapsed ? '展开左侧菜单' : '折叠左侧菜单'"
          @click="toggleSidebar"
        >
          <img :src="ExpandIcon" alt="" />
        </button>

        <!-- 会话消息部分 -->
        <section
          v-if="showMessages"
          ref="messageScrollRef"
          class="message-panel"
        >
          <div v-if="chatStore.pendingFrameworkUpdate" class="pending-bar">
            框架修改待确认：请在会话中回复“确认”或“取消”。
          </div>

          <StrategyMessageBubble
            v-for="message in chatStore.messages"
            :key="message.id"
            :message="message"
            :actions-disabled="isBusy"
            @action="handleCardAction"
          />

          <div v-if="isBusy" class="assistant-loading">
            {{ chatStore.uploading ? "正在上传并解析资料" : "正在处理" }}
          </div>
        </section>

        <section v-else class="hero">
          <h1>别再问我怎么搞钱了！用好车肆，先赚一个小目标！</h1>
          <div class="feature-grid">
            <FeatureCard
              v-for="feature in homeStore.features"
              :key="feature.title"
              :feature="feature"
              @select="handleFeatureSelect"
            />
          </div>
        </section>

        <p v-if="strategyNotice" class="error-text">{{ strategyNotice }}</p>

        <ChatComposer
          :disabled="isBusy"
          @send="handleSend"
          @upload="handleUpload"
        />
      </main>
    </div>

    <AccountSettingsDialog v-model="isSettingsVisible" />
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from "element-plus";
import { useAuthStore } from "@/stores/auth";
import ExpandIcon from "@/assets/svg/expandIcon.svg";
import AccountSettingsDialog from "./components/AccountSettingsDialog.vue";
import AppSidebar from "./components/AppSidebar.vue";
import ChatComposer from "./components/ChatComposer.vue";
import FeatureCard from "./components/FeatureCard.vue";
import StrategyMessageBubble from "./components/strategy/StrategyMessageBubble.vue";
import {
  useHomeStore,
  type FeatureCard as FeatureCardModel,
} from "./stores/home";
import { useStrategyChatStore } from "./stores/strategyChat";

const homeStore = useHomeStore();
const chatStore = useStrategyChatStore();
const authStore = useAuthStore();
const pageLoading = ref(true);
const isSidebarCollapsed = ref(false);
const isSettingsVisible = ref(false);
const messageScrollRef = ref<HTMLElement>();

const isBusy = computed(
  () => pageLoading.value || chatStore.loading || chatStore.uploading,
);
const showMessages = computed(() => chatStore.messages.length > 0);
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
const strategyNotice = computed(
  () => chatStore.error || chatStore.unavailableReason,
);
const companyName = computed(
  () => authStore.user?.tenantId || "车肆企业空间",
);

const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value;
};

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
  sync_reports: "同步报告",
  open_dashboard: "打开品牌战略看板",
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

const scrollToBottom = async () => {
  await nextTick();

  if (messageScrollRef.value) {
    messageScrollRef.value.scrollTop = messageScrollRef.value.scrollHeight;
  }
};

const handleCreateSession = async () => {
  try {
    await chatStore.createSession();
    await scrollToBottom();
  } catch (err) {
    ElMessage.error(
      err instanceof Error ? err.message : chatStore.error || "创建会话失败",
    );
  }
};

const handleSelectSession = async (sessionId: string) => {
  try {
    await chatStore.selectSession(sessionId);
    await scrollToBottom();
  } catch (err) {
    ElMessage.error(
      err instanceof Error ? err.message : chatStore.error || "读取会话失败",
    );
  }
};

const handleSend = async (content: string) => {
  try {
    await chatStore.send(content);
    await scrollToBottom();
  } catch (err) {
    ElMessage.error(
      err instanceof Error ? err.message : chatStore.error || "发送失败",
    );
  }
};

const handleUpload = async (file: File) => {
  try {
    await chatStore.uploadFile(file);
    await scrollToBottom();
    ElMessage.success("资料已上传");
  } catch (err) {
    ElMessage.error(
      err instanceof Error ? err.message : chatStore.error || "上传失败",
    );
  }
};

const handleCardAction = async (
  action: string,
  payload?: Record<string, unknown>,
) => {
  if (isBusy.value) {
    return;
  }

  if (action === "view_report") {
    const reportType = typeof payload?.type === "string" ? payload.type : "";
    const diagnosisId =
      typeof payload?.diagnosisId === "string" ? payload.diagnosisId : null;

    if (reportType) {
      await chatStore.openReport(reportType, { diagnosisId });
      await scrollToBottom();
      return;
    }
  }

  const mappedReportType = reportActionTypes[action];

  if (mappedReportType) {
    await chatStore.openReport(mappedReportType);
    await scrollToBottom();
    return;
  }

  if (action === "upload_files" || action === "upload_more_files") {
    ElMessage.info("请点击输入框左侧 + 上传资料");
    return;
  }

  if (action === "supplement_form") {
    ElMessage.info("请在输入框按字段名补充缺失内容");
    return;
  }

  const prompt = actionPrompts[action];

  if (!prompt) {
    ElMessage.info("请在输入框补充具体内容");
    return;
  }

  try {
    await chatStore.sendStrategy(prompt);
    await scrollToBottom();
  } catch (err) {
    ElMessage.error(
      err instanceof Error ? err.message : chatStore.error || "发送失败",
    );
  }
};

const handleFeatureSelect = async (feature: FeatureCardModel) => {
  if (feature.action !== "strategy-chat") {
    return;
  }

  try {
    await chatStore.enterStrategy();
    await scrollToBottom();
  } catch (err) {
    ElMessage.error(
      err instanceof Error ? err.message : chatStore.error || "进入失败",
    );
  }
};

watch(
  () => [chatStore.messages.length, chatStore.loading, chatStore.uploading],
  () => {
    scrollToBottom();
  },
);

onMounted(async () => {
  try {
    await chatStore.initialize();
  } catch (err) {
    chatStore.error = err instanceof Error ? err.message : "读取会话失败";
  } finally {
    pageLoading.value = false;
    await scrollToBottom();
  }
});
</script>

<style scoped lang="scss">
.home-page {
  min-height: 100vh;
  overflow: hidden;
  background: #ffffff;
}

.top-strip {
  height: 36px;
  background: #bfbfbf;
}

.workspace {
  display: flex;
  min-height: calc(100vh - 36px);
}

.main-panel {
  position: relative;
  flex: 1;
  min-width: 0;
  height: calc(100vh - 36px);
  padding-bottom: 126px;
  background: #ffffff;
}

.collapse-button {
  position: absolute;
  top: 13px;
  left: 15px;
  display: grid;
  width: 20px;
  height: 20px;
  place-items: center;
  color: #20242b;
}

.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 67px;

  h1 {
    margin: 0 0 45px;
    color: #2f333a;
    font-size: 18px;
    font-weight: 800;
    letter-spacing: 0.5px;
  }
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(3, 136px);
  gap: 55px 38px;
}

.message-panel {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 162px);
  gap: 14px;
  margin: 46px 26px 0;
  padding: 18px;
  overflow-y: auto;
  background: #f7f9fc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
}

.pending-bar {
  padding: 10px 12px;
  color: #8a4b00;
  font-size: 13px;
  background: #fff7e6;
  border: 1px solid #ffe0a3;
  border-radius: 8px;
}

.assistant-loading {
  align-self: flex-start;
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
</style>
