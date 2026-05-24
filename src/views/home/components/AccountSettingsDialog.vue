<template>
  <Teleport to="body">
    <Transition name="settings-modal">
      <div
        v-if="modelValue"
        class="settings-overlay"
        role="dialog"
        aria-modal="true"
        aria-label="账号设置"
        @click.self="close"
      >
        <section class="settings-panel">
          <aside class="settings-nav">
            <button class="close-button" type="button" aria-label="关闭" @click="close">
              <el-icon><Close /></el-icon>
            </button>

            <button class="nav-item active" type="button">
              <el-icon><User /></el-icon>
              <span>账号设置</span>
            </button>
          </aside>

          <main class="settings-content">
            <header class="content-header">
              <h2>账户</h2>
              <span v-if="loading">正在同步账号信息</span>
            </header>

            <div class="settings-section account-summary">
              <div class="avatar-preview">
                <img v-if="form.avatarUrl" :src="form.avatarUrl" alt="用户头像" />
                <span v-else>{{ avatarInitial }}</span>
              </div>
              <div class="summary-text">
                <strong>{{ form.nickname || displayName }}</strong>
                <p>{{ userEmail || "未绑定邮箱" }}</p>
              </div>
              <input
                ref="avatarInputRef"
                class="avatar-input"
                type="file"
                accept="image/*"
                @change="handleAvatarChange"
              />
              <button class="secondary-button" type="button" @click="avatarInputRef?.click()">
                更换头像
              </button>
            </div>

            <div class="settings-section">
              <label class="form-row" for="nickname">
                <span>昵称</span>
                <input
                  id="nickname"
                  v-model.trim="form.nickname"
                  type="text"
                  placeholder="请输入昵称"
                />
              </label>

              <label class="form-row" for="phone">
                <span>手机号码</span>
                <input
                  id="phone"
                  v-model.trim="form.phone"
                  type="tel"
                  placeholder="请输入手机号码"
                />
              </label>
            </div>

            <div class="settings-section">
              <div class="section-title">修改密码</div>
              <label class="form-row" for="currentPassword">
                <span>当前密码</span>
                <input
                  id="currentPassword"
                  v-model="form.currentPassword"
                  type="password"
                  autocomplete="current-password"
                  placeholder="请输入当前密码"
                />
              </label>
              <label class="form-row" for="newPassword">
                <span>新密码</span>
                <input
                  id="newPassword"
                  v-model="form.newPassword"
                  type="password"
                  autocomplete="new-password"
                  placeholder="至少 6 位"
                />
              </label>
              <label class="form-row" for="confirmPassword">
                <span>确认新密码</span>
                <input
                  id="confirmPassword"
                  v-model="form.confirmPassword"
                  type="password"
                  autocomplete="new-password"
                  placeholder="再次输入新密码"
                />
              </label>
            </div>

            <div class="settings-section">
              <div class="section-title">企业信息</div>
              <div class="readonly-row">
                <span>企业名称</span>
                <strong>{{ tenantName }}</strong>
              </div>
              <div class="readonly-row">
                <span>姓名</span>
                <strong>{{ displayName }}</strong>
              </div>
              <div class="readonly-row">
                <span>角色</span>
                <strong>{{ roleText }}</strong>
              </div>
              <div class="readonly-row">
                <span>所属组织</span>
                <strong>{{ organizationText }}</strong>
              </div>
            </div>

            <footer class="settings-actions">
              <button class="ghost-button" type="button" @click="resetForm">重置</button>
              <button class="primary-button" type="button" @click="saveSettings">
                保存设置
              </button>
            </footer>
          </main>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ElMessage } from "element-plus";
import { Close, User } from "@element-plus/icons-vue";
import { request } from "@/services/api";
import { useAuthStore } from "@/stores/auth";
import type { LoginResponse } from "@/types/strategy";

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

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

const authStore = useAuthStore();
const avatarInputRef = ref<HTMLInputElement>();
const loading = ref(false);
const meContext = ref<MeContext | null>(null);
const form = reactive({
  avatarUrl: "",
  nickname: "",
  phone: "",
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
});

const user = computed(() => meContext.value?.user ?? authStore.user);
const displayName = computed(
  () => user.value?.name || user.value?.loginName || user.value?.email || "未命名用户",
);
const userEmail = computed(() => user.value?.email || "");
const avatarInitial = computed(() => {
  const source = form.nickname || displayName.value || "车";
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

  if (user.value?.isTenantSuperAdmin) {
    return "企业超级管理员";
  }

  if (user.value?.role === "ADMIN") {
    return "系统管理员";
  }

  return "普通成员";
});
const organizationText = computed(
  () => user.value?.organizationName || user.value?.departmentName || "暂未设置",
);

const close = () => {
  emit("update:modelValue", false);
};

const readLocalSettings = (): LocalSettings => {
  try {
    const raw = localStorage.getItem(LOCAL_SETTINGS_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<LocalSettings>) : {};

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
};

const applyLocalSettings = () => {
  const settings = readLocalSettings();
  form.avatarUrl = settings.avatarUrl;
  form.nickname = settings.nickname;
  form.phone = settings.phone;
  form.currentPassword = "";
  form.newPassword = "";
  form.confirmPassword = "";
};

const fetchMe = async () => {
  loading.value = true;

  try {
    meContext.value = await request<MeContext>("/me");
  } catch {
    meContext.value = null;
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  applyLocalSettings();
};

const handleAvatarChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    form.avatarUrl = typeof reader.result === "string" ? reader.result : "";
  };
  reader.readAsDataURL(file);
  input.value = "";
};

const saveSettings = () => {
  const hasPasswordInput = Boolean(
    form.currentPassword || form.newPassword || form.confirmPassword,
  );

  if (hasPasswordInput) {
    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      ElMessage.warning("请完整填写密码修改信息");
      return;
    }

    if (form.newPassword.length < 6) {
      ElMessage.warning("新密码至少需要 6 位");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      ElMessage.warning("两次输入的新密码不一致");
      return;
    }
  }

  const settings: LocalSettings = {
    avatarUrl: form.avatarUrl,
    nickname: form.nickname,
    phone: form.phone,
  };
  localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(settings));
  authStore.patchLocalUser({
    avatarUrl: settings.avatarUrl,
    nickname: settings.nickname,
    phone: settings.phone,
  });
  form.currentPassword = "";
  form.newPassword = "";
  form.confirmPassword = "";
  ElMessage.success("账号设置已保存");
};

watch(
  () => props.modelValue,
  (visible) => {
    if (!visible) {
      return;
    }

    applyLocalSettings();
    fetchMe();
  },
  { immediate: true },
);
</script>

<style scoped lang="scss">
.settings-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background: rgb(0 0 0 / 12%);
  backdrop-filter: blur(1px);
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

.close-button {
  display: grid;
  width: 28px;
  height: 28px;
  margin-bottom: 28px;
  place-items: center;
  color: #111111;
  border-radius: 8px;

  .el-icon {
    font-size: 24px;
  }

  &:hover {
    background: #f2f2f2;
  }
}

.nav-item {
  display: flex;
  align-items: center;
  width: 100%;
  height: 44px;
  gap: 12px;
  padding: 0 14px;
  color: #181818;
  font-size: 16px;
  text-align: left;
  border-radius: 12px;

  .el-icon {
    font-size: 21px;
  }

  &.active {
    background: #f2f2f2;
  }
}

.settings-content {
  min-width: 0;
  padding: 28px 44px 34px 16px;
  overflow-y: auto;
}

.content-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 24px;
  border-bottom: 1px solid #dedede;

  h2 {
    margin: 0;
    color: #111111;
    font-size: 25px;
    font-weight: 600;
    letter-spacing: 0;
  }

  span {
    color: #8b8b8b;
    font-size: 13px;
  }
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

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.summary-text {
  min-width: 0;
  flex: 1;

  strong {
    display: block;
    overflow: hidden;
    color: #151515;
    font-size: 17px;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  p {
    margin: 5px 0 0;
    overflow: hidden;
    color: #6b6b6b;
    font-size: 14px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.avatar-input {
  display: none;
}

.section-title {
  margin-bottom: 12px;
  color: #111111;
  font-size: 17px;
  font-weight: 600;
}

.form-row,
.readonly-row {
  display: grid;
  grid-template-columns: 148px minmax(0, 1fr);
  align-items: center;
  min-height: 54px;
  gap: 20px;

  span {
    color: #111111;
    font-size: 16px;
  }

  input,
  strong {
    min-width: 0;
    justify-self: stretch;
    color: #5b5b5b;
    font-size: 16px;
    font-weight: 400;
    text-align: right;
  }

  input {
    height: 38px;
    padding: 0 12px;
    background: #f7f7f7;
    border: 1px solid transparent;
    border-radius: 9px;
    outline: none;

    &:focus {
      background: #ffffff;
      border-color: #bcbcbc;
    }
  }
}

.secondary-button,
.ghost-button,
.primary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  padding: 0 16px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 999px;
}

.secondary-button,
.ghost-button {
  color: #111111;
  background: #f4f4f4;

  &:hover {
    background: #ececec;
  }
}

.primary-button {
  color: #ffffff;
  background: #111827;

  &:hover {
    background: #263142;
  }
}

.settings-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 20px;
}

.settings-modal-enter-active,
.settings-modal-leave-active {
  transition: opacity 0.16s ease;

  .settings-panel {
    transition:
      opacity 0.16s ease,
      transform 0.16s ease;
  }
}

.settings-modal-enter-from,
.settings-modal-leave-to {
  opacity: 0;

  .settings-panel {
    opacity: 0;
    transform: translateY(10px) scale(0.98);
  }
}

@media (max-width: 860px) {
  .settings-overlay {
    padding: 16px;
  }

  .settings-panel {
    grid-template-columns: 160px minmax(0, 1fr);
    width: calc(100vw - 32px);
    height: calc(100vh - 32px);
  }

  .settings-nav {
    padding: 22px 14px;
  }

  .settings-content {
    padding-right: 24px;
  }

  .form-row,
  .readonly-row {
    grid-template-columns: 1fr;
    gap: 8px;
    padding: 8px 0;

    input,
    strong {
      text-align: left;
    }
  }
}
</style>
