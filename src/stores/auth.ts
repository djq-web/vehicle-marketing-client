import { defineStore } from "pinia";
import { request } from "@/services/api";
import type { LoginResponse } from "@/types/strategy";

const AUTH_TOKEN_KEY = "vehicle_marketing_client_token";
const AUTH_USER_KEY = "vehicle_marketing_client_user";

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
      this.token = localStorage.getItem(AUTH_TOKEN_KEY) || "";
      const savedUser = localStorage.getItem(AUTH_USER_KEY);
      this.user = savedUser ? (JSON.parse(savedUser) as AuthUser) : null;
    },
    async login(loginName: string, password: string) {
      const result = await request<LoginResponse>("/auth/login", {
        method: "POST",
        body: {
          loginName,
          email: loginName,
          password,
        },
        skipAuth: true,
      });

      this.token = result.token;
      this.user = result.user;
      localStorage.setItem(AUTH_TOKEN_KEY, result.token);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(result.user));

      return result;
    },
    logout() {
      this.token = "";
      this.user = null;
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
    },
    patchLocalUser(partial: Partial<AuthUser>) {
      if (!this.user) {
        return;
      }

      this.user = {
        ...this.user,
        ...partial,
      };
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(this.user));
    },
  },
});
