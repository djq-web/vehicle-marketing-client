import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/home/HomeView.vue'),
    meta: {
      title: '首页',
    },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/login/LoginView.vue'),
    meta: {
      title: '登录',
    },
  },
  {
    path: '/core-metrics',
    name: 'core-metrics',
    component: () => import('@/views/core-metrics/CoreMetricsView.vue'),
    meta: {
      title: '核心指标看板',
    },
  },
  {
    path: '/brand-strategy',
    name: 'brand-strategy',
    component: () => import('@/views/brand-strategy/BrandStrategyView.vue'),
    meta: {
      title: '品牌战略看板',
    },
  },
  {
    path: '/marketing-operations',
    name: 'marketing-operations',
    component: () => import('@/views/marketing-operations/MarketingOperationsView.vue'),
    meta: {
      title: '营销运营看板',
    },
  },
  {
    path: '/marketing-calendar',
    name: 'marketing-calendar',
    component: () => import('@/views/marketing-calendar/MarketingCalendarView.vue'),
    meta: {
      title: '营销日历看板',
    },
  },
  {
    path: '/market-feedback',
    name: 'market-feedback',
    component: () => import('@/views/market-feedback/MarketFeedbackView.vue'),
    meta: {
      title: '市场反馈看板',
    },
  },
  {
    path: '/ecological-partner',
    name: 'ecological-partner',
    component: () => import('@/views/ecological-partner/EcologicalPartnerView.vue'),
    meta: {
      title: '生态伙伴看板',
    },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/not-found/NotFoundView.vue'),
    meta: {
      title: '页面不存在',
    },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to) => {
  if (typeof to.meta.title === 'string') {
    document.title = `${to.meta.title} - 车肆营销助手`
  }
})

export default router
