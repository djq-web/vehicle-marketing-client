<template>
  <view class="time-filter">
    <text>时间：</text>
    <button
      v-for="item in timeOptions"
      :key="item"
      :class="{ active: item === activeTime }"
      @click="selectTime(item)"
    >
      {{ item }}
    </button>
  </view>

  <section class="flow-hero">
    <text class="flow-title">核心指标看板</text>
    <text class="title-underline"></text>
  </section>

  <scroll-view class="flow-board" scroll-x scroll-y>
    <view class="flow-canvas metrics-canvas">
      <text
        v-for="edge in edges"
        :key="edge.id"
        class="flow-edge"
        :class="{ muted: edge.muted }"
        :style="edgeStyle(edge)"
      ></text>

      <view
        v-for="node in nodes"
        :key="node.id"
        class="flow-node metric-node"
        :class="metricNodeClass(node)"
        :style="nodeStyle(node)"
      >
        <text v-if="node.titleMode === 'vertical'" class="vertical-title">
          {{ node.title }}
        </text>
        <view class="metric-node-content">
          <text v-if="node.titleMode !== 'vertical'" class="node-title">
            {{ node.title }}
          </text>
          <view v-if="node.groups" class="metric-groups">
            <view v-for="group in node.groups" :key="group.label" class="metric-group">
              <text>{{ group.label }}</text>
              <view>
                <text class="metric-strong">{{ group.value }}</text>
                <text class="trend" :class="group.trend">
                  {{ group.trend === "up" ? "↑" : "↓" }}
                </text>
              </view>
            </view>
          </view>
          <text v-else-if="node.empty" class="empty-text">暂无数据</text>
          <view v-else class="metric-rows">
            <view
              v-for="row in node.rows"
              :key="`${row.label}-${row.value}`"
              class="metric-row"
            >
              <text class="row-label">{{ row.label }}：</text>
              <text class="metric-strong">{{ row.value }}</text>
              <text class="trend" :class="row.trend">
                {{ row.trend === "up" ? "↑" : "↓" }}
              </text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </scroll-view>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { PropType } from "vue";

type Trend = "up" | "down";

type MetricRow = {
  label: string;
  value: string;
  trend: Trend;
};

type FlowNode = {
  id: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  active?: boolean;
  empty?: boolean;
  large?: boolean;
  tone?: string;
  titleMode?: "vertical";
  rows?: MetricRow[];
  groups?: MetricRow[];
};

type FlowEdge = {
  id: string;
  source: string;
  target: string;
  color?: string;
  muted?: boolean;
};

const props = defineProps({
  nodes: {
    type: Array as PropType<FlowNode[]>,
    required: true,
  },
  edges: {
    type: Array as PropType<FlowEdge[]>,
    required: true,
  },
  timeOptions: {
    type: Array as PropType<string[]>,
    required: true,
  },
  activeTime: {
    type: String,
    required: true,
  },
});

const emit = defineEmits<{
  "update:activeTime": [value: string];
}>();

const nodeMap = computed(() =>
  props.nodes.reduce<Record<string, FlowNode>>((result, node) => {
    result[node.id] = node;
    return result;
  }, {}),
);

function selectTime(value: string) {
  emit("update:activeTime", value);
}

function nodeStyle(node: FlowNode) {
  return `left:${node.x}px;top:${node.y}px;width:${node.width}px;height:${node.height}px;`;
}

function edgeStyle(edge: FlowEdge) {
  const source = nodeMap.value[edge.source];
  const target = nodeMap.value[edge.target];

  if (!source || !target) {
    return "";
  }

  const x1 = source.x + source.width / 2;
  const y1 = source.y + source.height;
  const x2 = target.x + target.width / 2;
  const y2 = target.y;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);
  const color = edge.color || "#36c5ff";

  return `left:${x1}px;top:${y1}px;width:${length}px;transform:rotate(${angle}rad);--edge-color:${color};background:${color};`;
}

function metricNodeClass(node: FlowNode) {
  return {
    active: node.active,
    large: node.large,
    empty: node.empty,
    horizontal: node.tone === "horizontal",
  };
}
</script>
