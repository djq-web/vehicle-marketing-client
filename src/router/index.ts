import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from "vue-router";
import { useAuthStore } from "@/stores/auth";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "home",
    component: () => import("@/views/home/HomeView.vue"),
    meta: {
      title: "首页",
    },
  },
  {
    path: "/login",
    name: "login",
    component: () => import("@/views/login/LoginView.vue"),
    meta: {
      title: "登录",
    },
  },
  {
    path: "/brand-strategy",
    name: "brand-strategy",
    component: () => import("@/views/basic-board/BasicBoardView.vue"),
    meta: {
      title: "品牌战略看板",
      subtitle: "锚定方向，塑造品牌心智",
      visual: "brandStrategy",
    },
  },
  {
    path: "/core-metrics",
    name: "core-metrics",
    component: () => import("@/views/core-metrics/CoreMetricsView.vue"),
    meta: {
      title: "核心指标看板",
    },
  },
  {
    path: "/key-metrics",
    name: "key-metrics",
    component: () => import("@/views/basic-board/BasicBoardView.vue"),
    meta: {
      title: "核心指标看板",
      subtitle: "数据驱动业务增长",
      visual: "keyMetrics",
    },
  },
  {
    path: "/marketing-operations",
    name: "marketing-operations",
    component: () => import("@/views/basic-board/BasicBoardView.vue"),
    meta: {
      title: "营销运营看板",
      subtitle: "全链路营销提效增长",
      visual: "marketingOperations",
    },
  },
  {
    path: "/ecological-partner",
    name: "ecological-partner",
    component: () =>
      import("@/views/ecological-partner/EcologicalPartnerView.vue"),
    meta: {
      title: "生态伙伴看板",
    },
  },
  {
    path: "/market-feedback",
    name: "market-feedback",
    component: () => import("@/views/market-feedback/MarketFeedbackView.vue"),
    meta: {
      title: "市场反馈看板",
    },
  },
  {
    path: "/marketing-calendar",
    name: "marketing-calendar",
    component: () =>
      import("@/views/marketing-calendar/MarketingCalendarView.vue"),
    meta: {
      title: "营销日历看板",
    },
  },
  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: () => import("@/views/not-found/NotFoundView.vue"),
    meta: {
      title: "页面不存在",
    },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach((to) => {
  const authStore = useAuthStore();
  authStore.restore();

  if (to.name !== "login" && !authStore.isAuthenticated) {
    return {
      name: "login",
      query: {
        redirect: to.fullPath,
      },
    };
  }

  if (typeof to.meta.title === "string") {
    document.title = `${to.meta.title} - 车肆营销助手`;
  }
});

export default router;
