<template>
  <view class="operations-desktop">
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

    <view class="flow-board">
      <view class="flow-canvas operations-canvas">
        <svg class="operations-flow-svg" :viewBox="`0 0 ${canvasWidth} ${canvasHeight}`" preserveAspectRatio="none">
          <defs>
            <marker id="operationsArrowBlue" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"
              markerUnits="strokeWidth">
              <path d="M0,0 L10,5 L0,10 Z" fill="#55cfff" />
            </marker>
            <marker id="operationsArrowMuted" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"
              markerUnits="strokeWidth">
              <path d="M0,0 L10,5 L0,10 Z" fill="#d7d7d7" />
            </marker>
          </defs>

          <g v-for="edge in drawableEdges" :key="edge.id">
            <path class="operations-line" :class="{ muted: edge.muted }" :d="svgPath(edge)" fill="none"
              :marker-end="edge.muted ? 'url(#operationsArrowMuted)' : 'url(#operationsArrowBlue)'" />
            <path v-if="!edge.muted" class="operations-flow" :style="flowStyle(edge)" :d="svgPath(edge)" fill="none" />
          </g>
        </svg>

        <view v-for="node in nodes" :key="node.id" class="flow-node operation-node" :class="operationNodeClass(node)"
          :style="nodeStyle(node)">
          <text class="status-dot" :class="node.status"></text>
          <text class="node-title">{{ node.title }}</text>
          <image class="operation-icon" :src="node.icon" mode="aspectFit" />
        </view>
      </view>
    </view>
  </view>
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

type Point = {
  x: number;
  y: number;
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

const canvasWidth = 1260;
const canvasHeight = 650;

const nodeMap = computed(() =>
  props.nodes.reduce<Record<string, FlowNode>>((result, node) => {
    result[node.id] = node;
    return result;
  }, {}),
);

const drawableEdges = computed(() =>
  props.edges.filter((edge) => nodeMap.value[edge.source] && nodeMap.value[edge.target]),
);

function nodeStyle(node: FlowNode) {
  return `left:${node.x}px;top:${node.y}px;width:${node.width}px;height:${node.height}px;`;
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

function topCenter(node: FlowNode): Point {
  return { x: node.x + node.width / 2, y: node.y };
}

function bottomCenter(node: FlowNode): Point {
  return { x: node.x + node.width / 2, y: node.y + node.height };
}

function leftCenter(node: FlowNode): Point {
  return { x: node.x, y: node.y + node.height / 2 };
}

function rightCenter(node: FlowNode): Point {
  return { x: node.x + node.width, y: node.y + node.height / 2 };
}

function elbowPoints(start: Point, end: Point, midY = Math.round((start.y + end.y) / 2)): Point[] {
  return [start, { x: start.x, y: midY }, { x: end.x, y: midY }, end];
}

function routePoints(edge: FlowEdge): Point[] {
  const source = nodeMap.value[edge.source];
  const target = nodeMap.value[edge.target];
  const route = edgeRoutes[edge.id];

  if (!source || !target) {
    return [];
  }

  return route ? route(source, target) : elbowPoints(bottomCenter(source), topCenter(target));
}

function svgPath(edge: FlowEdge) {
  const points = routePoints(edge);

  if (!points.length) {
    return "";
  }

  return points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`)
    .join(" ");
}

function flowStyle(edge: FlowEdge) {
  const index = Math.max(0, drawableEdges.value.findIndex((item) => item.id === edge.id));
  return `animation-delay:${(index % 6) * -0.48}s;`;
}

const edgeRoutes: Record<string, (source: FlowNode, target: FlowNode) => Point[]> = {
  "analysis-strategy": (source, target) => {
    const start = leftCenter(source);
    const end = leftCenter(target);
    return [start, { x: 28, y: start.y }, { x: 28, y: end.y }, end];
  },
  "strategy-visual": (source, target) => {
    const start = leftCenter(source);
    const end = topCenter(target);
    return [start, { x: 96, y: start.y }, { x: 96, y: end.y - 20 }, { x: end.x, y: end.y - 20 }, end];
  },
  "strategy-shortVideo": (source, target) => elbowPoints(bottomCenter(source), topCenter(target), 176),
  "strategy-live": (source, target) => elbowPoints(bottomCenter(source), topCenter(target), 176),
  "strategy-phone": (source, target) => elbowPoints(bottomCenter(source), topCenter(target), 176),
  "strategy-store": (source, target) => elbowPoints(bottomCenter(source), topCenter(target), 176),
  "strategy-ecommerce": (source, target) => elbowPoints(bottomCenter(source), topCenter(target), 176),
  "strategy-overseas": (source, target) => {
    const start = rightCenter(source);
    const end = topCenter(target);
    return [start, { x: 1240, y: start.y }, { x: 1240, y: end.y - 92 }, { x: end.x, y: end.y - 92 }, end];
  },
  "visual-private": (source, target) => elbowPoints(bottomCenter(source), topCenter(target), 338),
  "shortVideo-private": (source, target) => elbowPoints(bottomCenter(source), topCenter(target), 338),
  "live-private": (source, target) => elbowPoints(bottomCenter(source), topCenter(target), 338),
  "phone-private": (source, target) => elbowPoints(bottomCenter(source), topCenter(target), 338),
  "store-keyAccount": (source, target) => elbowPoints(bottomCenter(source), topCenter(target), 338),
  "ecommerce-keyAccount": (source, target) => elbowPoints(bottomCenter(source), topCenter(target), 338),
  "strategy-keyAccount": (source, target) => {
    const start = rightCenter(source);
    const end = rightCenter(target);
    return [start, { x: 1020, y: start.y }, { x: 1020, y: end.y }, end];
  },
  "private-analysis": (source, target) => elbowPoints(bottomCenter(source), topCenter(target), 556),
  "keyAccount-analysis": (source, target) => elbowPoints(bottomCenter(source), topCenter(target), 556),
  "overseas-whatsapp": (source, target) => elbowPoints(bottomCenter(source), topCenter(target), 338),
  "whatsapp-analysis": (source, target) => {
    const start = bottomCenter(source);
    const end = rightCenter(target);
    return [start, { x: start.x, y: 572 }, { x: end.x + 28, y: 572 }, end];
  },
};
</script>

<style scoped>
.operations-desktop {
  position: relative;
  height: calc(100vh - 54px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.status-legend {
  position: absolute;
  top: 34px;
  left: 8px;
  z-index: 6;
  display: flex;
  align-items: center;
  gap: 28px;
  color: #383f4a;
  font-size: 12px;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

.legend-dot,
.status-dot {
  width: 11px;
  height: 11px;
  border-radius: 50%;
}

.legend-dot.done,
.status-dot.done {
  background: #52d61d;
}

.legend-dot.doing,
.status-dot.doing {
  background: #38bdf8;
}

.legend-dot.pending,
.status-dot.pending {
  background: #ffb42a;
}

.legend-dot.disabled,
.status-dot.disabled {
  background: #c9c9c9;
}

.flow-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.flow-title {
  display: block;
  color: #333333;
  font-size: 28px;
  font-weight: 800;
  letter-spacing: 7px;
  line-height: 1.25;
}

.title-underline {
  display: block;
  width: 230px;
  height: 4px;
  margin-top: 8px;
  background: #1267ff;
  border-radius: 999px;
}

.flow-board {
  flex: 1;
  min-height: 0;
  padding-top: 18px;
  overflow: auto;
  box-sizing: border-box;
}

.flow-board::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.flow-board::-webkit-scrollbar-button,
.flow-board::-webkit-scrollbar-button:vertical:start:decrement,
.flow-board::-webkit-scrollbar-button:vertical:end:increment,
.flow-board::-webkit-scrollbar-button:horizontal:start:decrement,
.flow-board::-webkit-scrollbar-button:horizontal:end:increment {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
  background: transparent !important;
  -webkit-appearance: none;
}

.flow-board::-webkit-scrollbar-track,
.flow-board::-webkit-scrollbar-corner {
  background: transparent;
}

.flow-board::-webkit-scrollbar-thumb {
  background: #d4d4d4;
  border-radius: 999px;
}

.flow-canvas {
  position: relative;
  max-width: 1260px;
  min-height: 650px;
  margin: 0 auto;
}

.operations-canvas {
  min-height: 650px;
}

.operations-flow-svg {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 1260px;
  height: 650px;
  overflow: visible;
  pointer-events: none;
}

.operations-line {
  stroke: #55cfff;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
  filter: drop-shadow(0 0 4px rgb(85 207 255 / 34%));
}

.operations-line.muted {
  stroke: #d7d7d7;
  stroke-width: 1.5;
  filter: none;
}

.operations-flow {
  stroke: #55cfff;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 2 18;
  filter: drop-shadow(0 0 7px rgb(85 207 255 / 86%));
  animation: operations-flow 2.4s linear infinite;
}

.flow-node {
  position: absolute;
  z-index: 2;
  box-sizing: border-box;
  background: #ffffff;
  border: 1px solid #edf0f4;
  border-radius: 13px;
  box-shadow: 0 3px 15px rgb(34 46 68 / 12%);
}

.operation-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.operation-node.wide {
  flex-direction: row;
  gap: 28px;
}

.operation-node.active {
  border: 2px solid #1267ff;
  box-shadow: 0 4px 16px rgb(18 103 255 / 24%);
}

.operation-node .status-dot {
  position: absolute;
  top: 10px;
  right: 10px;
}

.node-title {
  display: block;
  margin-bottom: 2px;
  color: #20242b;
  font-size: 14px;
  font-weight: 800;
  line-height: 1.2;
}

.operation-icon {
  width: 64px;
  height: 64px;
  display: block;
}

@keyframes operations-flow {
  from {
    stroke-dashoffset: 0;
  }

  to {
    stroke-dashoffset: -88;
  }
}
</style>
