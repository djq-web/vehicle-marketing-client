<template>
  <main class="core-metrics-page">
    <div class="time-filter">
      <span>时间：</span>
      <button v-for="item in timeOptions" :key="item" type="button" :class="{ active: item === activeTime }"
        @click="activeTime = item">
        {{ item }}
      </button>
    </div>

    <button class="back-button" type="button" @click="router.push('/')">返回首页</button>
    <h1>核心指标看板</h1>

    <section class="flow-board">
      <VueFlow v-model:nodes="nodes" v-model:edges="edges" :nodes-draggable="false" :nodes-connectable="false"
        :elements-selectable="false" :zoom-on-scroll="false" :zoom-on-pinch="false" :pan-on-drag="false"
        :prevent-scrolling="false" fit-view-on-init class="metrics-flow">
        <template #node-metric="{ data }">
          <article class="metric-node"
            :class="[{ active: data.active, large: data.large, empty: data.empty }, data.tone]">
            <h2 v-if="data.titleMode === 'vertical'" class="vertical-title">{{ data.title }}</h2>
            <div class="metric-content">
              <h2 v-if="data.titleMode !== 'vertical'">{{ data.title }}</h2>
              <div v-if="data.groups" class="metric-groups">
                <div v-for="group in data.groups" :key="group.label" class="metric-group">
                  <span>{{ group.label }}</span>
                  <strong>{{ group.value }}</strong>
                  <i :class="group.trend">{{ group.trend === 'up' ? '↑' : '↓' }}</i>
                </div>
              </div>
              <template v-else-if="data.empty">
                <p class="empty-text">暂无数据</p>
              </template>
              <template v-else>
                <p v-for="row in data.rows" :key="`${row.label}-${row.value}`">
                  <span>{{ row.label }}：</span>
                  <strong>{{ row.value }}</strong>
                  <i :class="row.trend">{{ row.trend === 'up' ? '↑' : '↓' }}</i>
                </p>
              </template>
            </div>
          </article>
        </template>
      </VueFlow>
    </section>
  </main>
</template>

<script setup lang="ts">
import { MarkerType, Position, VueFlow, type Edge, type Node } from '@vue-flow/core'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'

interface MetricRow {
  label: string
  value: string
  trend: 'up' | 'down'
}

interface MetricGroup extends MetricRow { }

interface MetricNodeData {
  title: string
  titleMode?: 'vertical'
  large?: boolean
  active?: boolean
  empty?: boolean
  tone?: string
  rows?: MetricRow[]
  groups?: MetricGroup[]
}

const router = useRouter()
const timeOptions = ['当天', '当月', '当季', '当年']
const activeTime = ref('当月')

const makeNode = (id: string, position: { x: number; y: number }, data: MetricNodeData, width = 126, height = 122): Node<MetricNodeData> => ({
  id,
  type: 'metric',
  position,
  sourcePosition: Position.Bottom,
  targetPosition: Position.Top,
  data,
  style: {
    width: `${width}px`,
    height: `${height}px`,
  },
})

const nodes = ref<Node<MetricNodeData>[]>([
  makeNode(
    'company',
    { x: 382, y: 38 },
    {
      title: '公司战略',
      titleMode: 'vertical',
      large: true,
      groups: [
        { label: '营收', value: '10,000,000', trend: 'up' },
        { label: '总客户数', value: '3228', trend: 'up' },
        { label: '活跃客户数', value: '880', trend: 'up' },
        { label: '已流失客户数', value: '180', trend: 'down' },
        { label: '利润', value: '5,000,000', trend: 'up' },
        { label: '一次购买客户数', value: '1240', trend: 'down' },
        { label: '多次购买客户数', value: '580', trend: 'up' },
      ],
    },
    462,
    110,
  ),
  makeNode('image', { x: 50, y: 220 }, { title: '图文营销', rows: [{ label: '发布量', value: '12', trend: 'down' }, { label: '阅读量', value: '120000', trend: 'up' }, { label: '互动量', value: '3201', trend: 'up' }, { label: '私域引流数', value: '12', trend: 'up' }] }),
  makeNode('video', { x: 210, y: 220 }, { title: '短视频营销', rows: [{ label: '发布量', value: '12', trend: 'down' }, { label: '播放量', value: '1000', trend: 'up' }, { label: '互动量', value: '201', trend: 'up' }, { label: '私域引流数', value: '12', trend: 'up' }] }),
  makeNode('live', { x: 370, y: 220 }, { title: '直播营销', rows: [{ label: '直播场次', value: '4', trend: 'up' }, { label: '观看人数', value: '1210', trend: 'up' }, { label: '互动次数', value: '3201', trend: 'up' }, { label: '留资数', value: '240', trend: 'down' }] }),
  makeNode('phone', { x: 530, y: 220 }, { title: '电话营销', active: true, rows: [{ label: '外呼总量', value: '180', trend: 'up' }, { label: '接通率', value: '60%', trend: 'down' }, { label: '有效沟通数', value: '3201', trend: 'up' }, { label: '加微成功数', value: '12', trend: 'down' }] }),
  makeNode('store', { x: 690, y: 220 }, { title: '实体店铺', empty: true }),
  makeNode('ecommerce', { x: 850, y: 220 }, { title: '电商销售', empty: true }),
  makeNode('overseas', { x: 1070, y: 220 }, { title: '海外独立站', rows: [{ label: '访问量', value: '40', trend: 'down' }, { label: '留资数', value: '1210', trend: 'up' }, { label: '私域添加数', value: '321', trend: 'up' }] }),
  makeNode('private', { x: 330, y: 390 }, { title: '私域营销', rows: [{ label: '好友总数', value: '45', trend: 'up' }, { label: '新增数', value: '1210', trend: 'up' }, { label: '互动率', value: '31%', trend: 'down' }, { label: '转化率', value: '9.6%', trend: 'down' }] }, 126, 122),
  makeNode('customer', { x: 820, y: 390 }, { title: '大客户销售', rows: [{ label: '大客户总数', value: '40', trend: 'down' }, { label: '新增数', value: '1210', trend: 'up' }, { label: '平均变动次数', value: '32', trend: 'up' }, { label: '流失数', value: '22', trend: 'down' }] }, 126, 122),
  makeNode('whatsapp', { x: 1070, y: 390 }, { title: 'WhatsApp', rows: [{ label: '联系人总数', value: '40', trend: 'down' }, { label: '新增数', value: '1210', trend: 'up' }, { label: '打开率', value: '32%', trend: 'down' }, { label: '回复率', value: '12%', trend: 'up' }] }, 126, 122),
  makeNode('analysis', { x: 505, y: 560 }, { title: '营销分析', empty: true, tone: 'horizontal' }, 230, 64),
])

const edgeDefaults = {
  type: 'smoothstep',
  animated: true,
  markerEnd: MarkerType.ArrowClosed,
  style: { stroke: '#36c5ff', strokeWidth: 1.6 },
}

const makeEdge = (id: string, source: string, target: string, color = '#36c5ff'): Edge => ({
  id,
  source,
  target,
  ...edgeDefaults,
  style: { stroke: color, strokeWidth: 1.6 },
})

const edges = ref<Edge[]>([
  makeEdge('company-image', 'company', 'image'),
  makeEdge('company-video', 'company', 'video'),
  makeEdge('company-live', 'company', 'live'),
  makeEdge('company-phone', 'company', 'phone'),
  makeEdge('company-overseas', 'company', 'overseas'),
  makeEdge('image-private', 'image', 'private'),
  makeEdge('video-private', 'video', 'private'),
  makeEdge('live-private', 'live', 'private'),
  makeEdge('phone-analysis', 'phone', 'analysis'),
  makeEdge('private-analysis', 'private', 'analysis'),
  makeEdge('overseas-whatsapp', 'overseas', 'whatsapp'),
  makeEdge('whatsapp-analysis', 'whatsapp', 'analysis'),
  makeEdge('store-customer', 'store', 'customer', '#d9d9d9'),
  makeEdge('ecommerce-customer', 'ecommerce', 'customer', '#d9d9d9'),
  makeEdge('company-customer', 'company', 'customer', '#d9d9d9'),
])
</script>

<style scoped lang="scss">
.core-metrics-page {
  position: relative;
  min-height: 100vh;
  padding: 28px 26px 20px;
  background: #ffffff;
}

.time-filter {
  position: absolute;
  top: 36px;
  left: 27px;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #8b93a1;
  font-size: 12px;

  button {
    height: 28px;
    padding: 0 16px;
    color: #1f4da8;
    background: #ffffff;
    border: 1px solid #1267ff;
    border-radius: 999px;

    &.active {
      color: #ffffff;
      background: #1267ff;
      box-shadow: 0 6px 16px rgb(18 103 255 / 18%);
    }
  }
}

.back-button {
  position: absolute;
  top: 36px;
  right: 28px;
  z-index: 2;
  height: 30px;
  padding: 0 16px;
  color: #1267ff;
  background: #eef5ff;
  border: 1px solid #c8ddff;
  border-radius: 999px;
}

h1 {
  margin: 0 0 18px;
  color: #333333;
  font-size: 28px;
  font-weight: 800;
  letter-spacing: 7px;
  text-align: center;

  &::after {
    display: block;
    width: 184px;
    height: 4px;
    margin: 6px auto 0;
    content: '';
    background: #1267ff;
    border-radius: 999px;
  }
}

.flow-board {
  height: calc(100vh - 86px);
  min-height: 630px;
}

.metrics-flow {
  width: 100%;
  height: 100%;

  :deep(.vue-flow__pane) {
    cursor: default;
  }

  :deep(.vue-flow__node) {
    pointer-events: none;
  }

  :deep(.vue-flow__edge-path) {
    filter: drop-shadow(0 0 2px rgb(54 197 255 / 30%));
  }

  :deep(.vue-flow__edge.animated path) {
    stroke-dasharray: 7 7;
    animation: flow-line 0.75s linear infinite;
  }
}

.metric-node {
  display: flex;
  width: 100%;
  height: 100%;
  padding: 14px 16px;
  background: #ffffff;
  border: 1px solid #edf0f4;
  border-radius: 13px;
  box-shadow: 0 3px 15px rgb(34 46 68 / 12%);

  &.active {
    border: 2px solid #1267ff;
    box-shadow: 0 4px 16px rgb(18 103 255 / 24%);
  }

  &.large {
    align-items: center;
    gap: 18px;
    padding: 16px 22px;
  }

  &.horizontal {
    align-items: center;
    justify-content: space-between;

    .metric-content {
      display: flex;
      align-items: center;
      width: 100%;
      gap: 58px;
    }
  }

  h2 {
    margin: 0 0 14px;
    color: #20242b;
    font-size: 14px;
    font-weight: 800;
  }

  p {
    margin: 0 0 6px;
    color: #7d8490;
    font-size: 10px;
    white-space: nowrap;
  }

  strong {
    color: #252a33;
    font-weight: 800;
  }

  i {
    margin-left: 4px;
    font-style: normal;
    font-weight: 800;

    &.up {
      color: #ff1d2d;
    }

    &.down {
      color: #42c631;
    }
  }
}

.vertical-title {
  width: 18px;
  margin: 0;
  line-height: 1.2;
  text-align: center;
  writing-mode: vertical-rl;
}

.metric-content {
  flex: 1;
}

.metric-groups {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px 34px;
}

.metric-group {
  font-size: 10px;
  white-space: nowrap;

  span {
    display: block;
    margin-bottom: 5px;
    color: #8b93a1;
  }
}

.empty-text {
  display: flex;
  align-items: center;
  justify-content: center;
  height: calc(100% - 25px);
  color: #9da5b2;
}

@keyframes flow-line {
  from {
    stroke-dashoffset: 14;
  }

  to {
    stroke-dashoffset: 0;
  }
}
</style>
