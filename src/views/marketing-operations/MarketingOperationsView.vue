<template>
  <main class="marketing-operations-page">
    <div class="status-legend">
      <span v-for="item in statusLegend" :key="item.label">
        <i :class="item.type"></i>
        {{ item.label }}
      </span>
    </div>

    <button class="back-button" type="button" @click="router.push('/')">返回首页</button>
    <h1>营销运营看板</h1>

    <section class="flow-board">
      <VueFlow
        v-model:nodes="nodes"
        v-model:edges="edges"
        :nodes-draggable="false"
        :nodes-connectable="false"
        :elements-selectable="false"
        :zoom-on-scroll="false"
        :zoom-on-pinch="false"
        :pan-on-drag="false"
        :prevent-scrolling="false"
        fit-view-on-init
        class="operations-flow"
      >
        <template #node-operation="{ data }">
          <article class="operation-node" :class="[{ active: data.active, wide: data.wide }, data.status]">
            <span class="status-dot"></span>
            <h2>{{ data.title }}</h2>
            <img :src="data.icon" :alt="data.title" />
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
import corporateStrategyIcon from '@/assets/marketing-dashboard/corporate-strategy.svg'
import visualMarketingIcon from '@/assets/marketing-dashboard/visual-marketing.svg'
import shortVideoMarketingIcon from '@/assets/marketing-dashboard/short-video-marketing.svg'
import liveStreamingMarketingIcon from '@/assets/marketing-dashboard/live-streaming-marketing.svg'
import telemarketingIcon from '@/assets/marketing-dashboard/telemarketing.svg'
import brickAndMortarStoreIcon from '@/assets/marketing-dashboard/brick-and-mortar-store.svg'
import ecommerceSalesIcon from '@/assets/marketing-dashboard/e-commerce-sales.svg'
import overseasIndependentStationIcon from '@/assets/marketing-dashboard/overseas-independent-station.svg'
import privateDomainMarketingIcon from '@/assets/marketing-dashboard/private-domain-marketing.svg'
import keyAccountSalesIcon from '@/assets/marketing-dashboard/key-account-sales.svg'
import whatsAppIcon from '@/assets/marketing-dashboard/whatsApp.svg'
import marketingAnalysisIcon from '@/assets/marketing-dashboard/marketing-analysis.svg'

type OperationStatus = 'done' | 'doing' | 'pending' | 'disabled'

interface OperationNodeData {
  title: string
  icon: string
  status: OperationStatus
  active?: boolean
  wide?: boolean
}

const router = useRouter()
const statusLegend = [
  { label: '已完成', type: 'done' },
  { label: '进行中', type: 'doing' },
  { label: '待开始', type: 'pending' },
  { label: '未启用', type: 'disabled' },
]

const makeNode = (id: string, position: { x: number; y: number }, data: OperationNodeData, width = 124, height = 122): Node<OperationNodeData> => ({
  id,
  type: 'operation',
  position,
  sourcePosition: Position.Bottom,
  targetPosition: Position.Top,
  data,
  style: {
    width: `${width}px`,
    height: `${height}px`,
  },
})

const nodes = ref<Node<OperationNodeData>[]>([
  makeNode('strategy', { x: 520, y: 52 }, { title: '公司战略', icon: corporateStrategyIcon, status: 'done', wide: true }, 192, 88),
  makeNode('visual', { x: 60, y: 198 }, { title: '图文营销', icon: visualMarketingIcon, status: 'done' }),
  makeNode('shortVideo', { x: 220, y: 198 }, { title: '短视频营销', icon: shortVideoMarketingIcon, status: 'done' }),
  makeNode('live', { x: 380, y: 198 }, { title: '直播营销', icon: liveStreamingMarketingIcon, status: 'doing' }),
  makeNode('phone', { x: 540, y: 198 }, { title: '电话营销', icon: telemarketingIcon, status: 'pending', active: true }),
  makeNode('store', { x: 700, y: 198 }, { title: '实体店铺', icon: brickAndMortarStoreIcon, status: 'disabled' }),
  makeNode('ecommerce', { x: 860, y: 198 }, { title: '电商销售', icon: ecommerceSalesIcon, status: 'disabled' }),
  makeNode('overseas', { x: 1080, y: 198 }, { title: '海外独立站', icon: overseasIndependentStationIcon, status: 'doing' }),
  makeNode('private', { x: 340, y: 360 }, { title: '私域营销', icon: privateDomainMarketingIcon, status: 'disabled' }),
  makeNode('keyAccount', { x: 825, y: 360 }, { title: '大客户销售', icon: keyAccountSalesIcon, status: 'disabled' }),
  makeNode('whatsapp', { x: 1080, y: 360 }, { title: 'WhatsApp', icon: whatsAppIcon, status: 'doing' }),
  makeNode('analysis', { x: 520, y: 528 }, { title: '营销分析', icon: marketingAnalysisIcon, status: 'disabled', wide: true }, 192, 88),
])

const makeEdge = (id: string, source: string, target: string, color = '#35c7ff'): Edge => ({
  id,
  source,
  target,
  type: 'smoothstep',
  animated: true,
  markerEnd: MarkerType.ArrowClosed,
  style: {
    stroke: color,
    strokeWidth: 1.6,
  },
})

const edges = ref<Edge[]>([
  makeEdge('strategy-visual', 'strategy', 'visual'),
  makeEdge('strategy-shortVideo', 'strategy', 'shortVideo'),
  makeEdge('strategy-live', 'strategy', 'live'),
  makeEdge('strategy-phone', 'strategy', 'phone'),
  makeEdge('strategy-store', 'strategy', 'store', '#d7d7d7'),
  makeEdge('strategy-ecommerce', 'strategy', 'ecommerce', '#d7d7d7'),
  makeEdge('strategy-overseas', 'strategy', 'overseas'),
  makeEdge('visual-private', 'visual', 'private'),
  makeEdge('shortVideo-private', 'shortVideo', 'private'),
  makeEdge('live-private', 'live', 'private'),
  makeEdge('phone-analysis', 'phone', 'analysis'),
  makeEdge('private-analysis', 'private', 'analysis'),
  makeEdge('store-keyAccount', 'store', 'keyAccount', '#d7d7d7'),
  makeEdge('ecommerce-keyAccount', 'ecommerce', 'keyAccount', '#d7d7d7'),
  makeEdge('strategy-keyAccount', 'strategy', 'keyAccount', '#d7d7d7'),
  makeEdge('overseas-whatsapp', 'overseas', 'whatsapp'),
  makeEdge('whatsapp-analysis', 'whatsapp', 'analysis'),
])
</script>

<style scoped lang="scss">
.marketing-operations-page {
  position: relative;
  min-height: 100vh;
  padding: 28px 26px 20px;
  background: #ffffff;
}

.status-legend {
  position: absolute;
  top: 34px;
  left: 37px;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 28px;
  color: #383f4a;
  font-size: 12px;

  span {
    display: inline-flex;
    align-items: center;
    gap: 7px;
  }

  i {
    width: 11px;
    height: 11px;
    border-radius: 50%;
  }

  .done {
    background: #52d61d;
  }

  .doing {
    background: #38bdf8;
  }

  .pending {
    background: #ffb42a;
  }

  .disabled {
    background: #c9c9c9;
  }
}

.back-button {
  position: absolute;
  top: 34px;
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
  min-height: 620px;
}

.operations-flow {
  width: 100%;
  height: 100%;

  :deep(.vue-flow__pane) {
    cursor: default;
  }

  :deep(.vue-flow__node) {
    pointer-events: none;
  }

  :deep(.vue-flow__edge-path) {
    filter: drop-shadow(0 0 2px rgb(53 199 255 / 32%));
  }

  :deep(.vue-flow__edge.animated path) {
    stroke-dasharray: 8 8;
    animation: flow-line 0.75s linear infinite;
  }
}

.operation-node {
  position: relative;
  display: flex;
  width: 100%;
  height: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: #ffffff;
  border: 1px solid #edf0f4;
  border-radius: 13px;
  box-shadow: 0 3px 15px rgb(34 46 68 / 12%);

  &.active {
    border: 2px solid #1267ff;
    box-shadow: 0 4px 16px rgb(18 103 255 / 22%);
  }

  &.wide {
    flex-direction: row;
    gap: 28px;
  }

  h2 {
    margin: 0;
    color: #20242b;
    font-size: 14px;
    font-weight: 800;
  }

  img {
    width: 64px;
    height: 64px;
    object-fit: contain;
  }
}

.status-dot {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 11px;
  height: 11px;
  border-radius: 50%;
}

.done .status-dot {
  background: #52d61d;
}

.doing .status-dot {
  background: #38bdf8;
}

.pending .status-dot {
  background: #ffb42a;
}

.disabled .status-dot {
  background: #c9c9c9;
}

@keyframes flow-line {
  from {
    stroke-dashoffset: 16;
  }

  to {
    stroke-dashoffset: 0;
  }
}
</style>
