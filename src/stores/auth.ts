import { defineStore } from "pinia";
import { AUTH_TOKEN_KEY, AUTH_USER_KEY, request } from "@/services/api";
import type { LoginResponse } from "@/types/strategy";

type AuthUser = LoginResponse["user"];

export const useAuthStore = defineStore("auth", {
  state: () => ({
    token: "",
    user: null as AuthUser | null,
    restored: false,
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.token),
    tenantId: (state) => state.user?.tenantId,
    isTenantUser: (state) => state.user?.accountType === "tenant_user",
  },
  actions: {
    restore() {
      if (this.restored) {
        return;
      }

      this.restored = true;
      this.token = uni.getStorageSync(AUTH_TOKEN_KEY) || "";

      const savedUser = uni.getStorageSync(AUTH_USER_KEY);
      if (savedUser) {
        try {
          this.user =
            typeof savedUser === "string"
              ? (JSON.parse(savedUser) as AuthUser)
              : (savedUser as AuthUser);
        } catch {
          this.user = null;
        }
      }
    },
    async login(loginName: string, password: string) {
      const result = await request<LoginResponse>("/auth/login", {
        method: "POST",
        data: {
          loginName,
          password,
        },
        skipAuth: true,
      });

      this.token = result.token;
      this.user = result.user;
      uni.setStorageSync(AUTH_TOKEN_KEY, result.token);
      uni.setStorageSync(AUTH_USER_KEY, JSON.stringify(result.user));

      return result;
    },
    logout() {
      this.token = "";
      this.user = null;
      uni.removeStorageSync(AUTH_TOKEN_KEY);
      uni.removeStorageSync(AUTH_USER_KEY);
      uni.reLaunch({
        url: "/pages/login/index",
      });
    },
    patchLocalUser(patch: Partial<AuthUser>) {
      if (!this.user) {
        return;
      }

      this.user = {
        ...this.user,
        ...patch,
      };
      uni.setStorageSync(AUTH_USER_KEY, JSON.stringify(this.user));
    },
  },
});
