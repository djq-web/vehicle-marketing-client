import { defineStore } from 'pinia'

export interface ChatRecord {
  date: string
  title: string
  active?: boolean
  muted?: boolean
}

export interface FeatureCard {
  title: string
  description: string
  variant: 'cube' | 'book' | 'report' | 'flag' | 'diamond' | 'planet'
  active?: boolean
  routeName?: string
}

export const useHomeStore = defineStore('home', {
  state: () => ({
    recentChats: [
      { date: '7天内', title: '微信小程序报价方案' },
      { date: '2026-03', title: '官网报价方案' },
      { date: '2026-04', title: '微信小程序报价方案' },
      { date: '', title: '图文营销方案' },
      { date: '', title: '出一套商标布局方案' },
      { date: '', title: '邮件营销方案' },
      { date: '', title: '公司整体营销方案' },
      { date: '2026-03', title: '官网报价方案' },
      { date: '', title: '出一套商标布局方案' },
      { date: '', title: '官网报价方案' },
      { date: '', title: '梦想一场面式营销数据分析表' },
    ] as ChatRecord[],
    features: [
      {
        title: '品牌战略',
        description: '锚定方向，塑造品牌心智',
        variant: 'cube',
        routeName: 'brand-strategy',
      },
      {
        title: '核心指标',
        description: '数据驱动业务增长',
        variant: 'book',
        routeName: 'core-metrics',
      },
      {
        title: '营销运营',
        description: '全链路营销提效增长',
        variant: 'report',
        routeName: 'marketing-operations',
      },
      {
        title: '营销日历',
        description: '精准把控营销节点',
        variant: 'flag',
        routeName: 'marketing-calendar',
      },
      {
        title: '市场反馈',
        description: '倾听用户优化策略',
        variant: 'diamond',
        active: true,
        routeName: 'market-feedback',
      },
      {
        title: '生态伙伴',
        description: '携手同行共建生态',
        variant: 'planet',
        routeName: 'ecological-partner',
      },
    ] as FeatureCard[],
  }),
})
