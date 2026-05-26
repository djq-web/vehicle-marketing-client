<template>
  <view class="status-legend">
    <view v-for="item in statusLegend" :key="item.label" class="legend-item">
      <text class="legend-dot" :class="item.type"></text>
      <text>{{ item.label }}</text>
    </view>
  </view>

  <section class="flow-hero">
    <text class="flow-title">营销运营看板</text>
    <text class="title-underline"></text>
  </section>

  <scroll-view class="flow-board" scroll-x scroll-y>
    <view class="flow-canvas operations-canvas">
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
        class="flow-node operation-node"
        :class="operationNodeClass(node)"
        :style="nodeStyle(node)"
      >
        <text class="status-dot" :class="node.status"></text>
        <text class="node-title">{{ node.title }}</text>
        <image class="operation-icon" :src="node.icon" mode="aspectFit" />
      </view>
    </view>
  </scroll-view>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { PropType } from "vue";

type Status = "done" | "doing" | "pending" | "disabled";

type FlowNode = {
  id: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  active?: boolean;
  large?: boolean;
  status?: Status;
  icon?: string;
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
  statusLegend: {
    type: Array as PropType<Array<{ label: string; type: Status }>>,
    required: true,
  },
});

const nodeMap = computed(() =>
  props.nodes.reduce<Record<string, FlowNode>>((result, node) => {
    result[node.id] = node;
    return result;
  }, {}),
);

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

function operationNodeClass(node: FlowNode) {
  return {
    active: node.active,
    wide: node.large,
    done: node.status === "done",
    doing: node.status === "doing",
    pending: node.status === "pending",
    disabled: node.status === "disabled",
  };
}
</script>
