<template>
  <view class="key-metrics-desktop">
    <view class="metrics-filter">
      <text class="metrics-filter-label">时间：</text>
      <button v-for="item in timeOptions" :key="item" class="metrics-filter-button"
        :class="{ 'metrics-filter-button--active': item === activeTime }" @click="selectTime(item)">
        {{ item }}
      </button>
    </view>

    <view class="metrics-hero">
      <text class="metrics-title">核心指标看板</text>
      <text class="metrics-underline"></text>
    </view>

    <view class="metrics-board">
      <view class="metrics-canvas-wrap">
        <canvas id="metrics-flow-canvas" canvas-id="metrics-flow-canvas" class="metrics-flow-canvas"></canvas>

        <svg class="metrics-flow-svg" :viewBox="`0 0 ${canvasWidth} ${canvasHeight}`" preserveAspectRatio="none">
          <defs>
            <marker id="metrics-svg-arrow-blue" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"
              markerUnits="strokeWidth">
              <path d="M0,0 L10,5 L0,10 Z" fill="#55cfff" />
            </marker>
            <marker id="metrics-svg-arrow-muted" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"
              markerUnits="strokeWidth">
              <path d="M0,0 L10,5 L0,10 Z" fill="#d8dce3" />
            </marker>
          </defs>

          <g v-for="edge in drawableEdges" :key="edge.id">
            <path class="metrics-svg-line" :class="{ 'metrics-svg-line--muted': edge.muted }" :d="svgPath(edge)"
              fill="none" :marker-end="edge.muted ? 'url(#metrics-svg-arrow-muted)' : 'url(#metrics-svg-arrow-blue)'" />
            <path v-if="!edge.muted" class="metrics-svg-flow" :style="svgFlowStyle(edge)" :d="svgPath(edge)"
              fill="none" />
          </g>
        </svg>

        <view v-for="node in nodes" :key="node.id" class="metrics-node" :class="nodeClass(node)"
          :style="nodeStyle(node)">
          <text v-if="node.titleMode === 'vertical'" class="metrics-node-title-vertical">
            {{ node.title }}
          </text>
          <view class="metrics-node-body">
            <text v-if="node.titleMode !== 'vertical'" class="metrics-node-title">
              {{ node.title }}
            </text>
            <view v-if="node.groups" class="metrics-groups">
              <view v-for="group in node.groups" :key="group.label" class="metrics-group">
                <text class="metrics-label">{{ group.label }}</text>
                <view class="metrics-value-line">
                  <text class="metrics-strong">{{ group.value }}</text>
                  <text class="metrics-trend" :class="`metrics-trend--${group.trend}`">
                    {{ group.trend === "up" ? "↑" : "↓" }}
                  </text>
                </view>
              </view>
            </view>
            <text v-else-if="node.empty" class="metrics-empty">暂无数据</text>
            <view v-else class="metrics-rows">
              <view v-for="row in node.rows" :key="`${row.label}-${row.value}`" class="metrics-row">
                <text class="metrics-row-label">{{ row.label }}：</text>
                <text class="metrics-strong">{{ row.value }}</text>
                <text class="metrics-trend" :class="`metrics-trend--${row.trend}`">
                  {{ row.trend === "up" ? "↑" : "↓" }}
                </text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, onBeforeUnmount, onMounted, watch } from "vue";
import type { PropType } from "vue";
import { useDraw } from "u-draw/dist/index.js";

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

const canvasWidth = 1400;
const canvasHeight = 730;
const activeColor = "#55cfff";
const mutedColor = "#d8dce3";
const componentThis = getCurrentInstance()?.proxy;
const drawInstance = useDraw("#metrics-flow-canvas", {
  componentThis,
  type: "2d",
  immediate: false,
});

let stopAnimation: (() => void) | null = null;
let frameId = 0;

const nodeMap = computed(() =>
  props.nodes.reduce<Record<string, FlowNode>>((result, node) => {
    result[node.id] = node;
    return result;
  }, {}),
);

const drawableEdges = computed(() =>
  props.edges.filter((edge) => nodeMap.value[edge.source] && nodeMap.value[edge.target]),
);

function selectTime(value: string) {
  emit("update:activeTime", value);
}

function nodeStyle(node: FlowNode) {
  return `left:${node.x}px;top:${node.y}px;width:${node.width}px;height:${node.height}px;`;
}

function nodeClass(node: FlowNode) {
  return {
    "metrics-node--active": node.active,
    "metrics-node--large": node.large,
    "metrics-node--empty": node.empty,
    "metrics-node--horizontal": node.tone === "horizontal",
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

function svgFlowStyle(edge: FlowEdge) {
  const index = Math.max(0, drawableEdges.value.findIndex((item) => item.id === edge.id));
  return `animation-delay:${(index % 6) * -0.5}s;`;
}

const edgeRoutes: Record<string, (source: FlowNode, target: FlowNode) => Point[]> = {
  "analysis-company": (source, target) => {
    const start = leftCenter(source);
    const end = leftCenter(target);
    return [start, { x: 24, y: start.y }, { x: 24, y: end.y }, end];
  },
  "company-image": (source, target) => {
    const start = leftCenter(source);
    const end = topCenter(target);
    return [start, { x: 90, y: start.y }, { x: 90, y: end.y - 28 }, { x: end.x, y: end.y - 28 }, end];
  },
  "company-video": (source, target) => elbowPoints(bottomCenter(source), topCenter(target), 200),
  "company-live": (source, target) => elbowPoints(bottomCenter(source), topCenter(target), 200),
  "company-phone": (source, target) => elbowPoints(bottomCenter(source), topCenter(target), 200),
  "company-store": (source, target) => elbowPoints(bottomCenter(source), topCenter(target), 200),
  "company-ecommerce": (source, target) => elbowPoints(bottomCenter(source), topCenter(target), 200),
  "company-overseas": (source, target) => {
    const start = rightCenter(source);
    const end = topCenter(target);
    return [start, { x: 1320, y: start.y }, { x: 1320, y: end.y - 94 }, { x: end.x, y: end.y - 94 }, end];
  },
  "image-private": (source, target) => elbowPoints(bottomCenter(source), topCenter(target), 405),
  "video-private": (source, target) => elbowPoints(bottomCenter(source), topCenter(target), 405),
  "live-private": (source, target) => elbowPoints(bottomCenter(source), topCenter(target), 405),
  "phone-private": (source, target) => elbowPoints(bottomCenter(source), topCenter(target), 405),
  "store-customer": (source, target) => elbowPoints(bottomCenter(source), topCenter(target), 405),
  "ecommerce-customer": (source, target) => elbowPoints(bottomCenter(source), topCenter(target), 405),
  "company-customer": (source, target) => {
    const start = rightCenter(source);
    const end = rightCenter(target);
    return [start, { x: 1120, y: start.y }, { x: 1120, y: end.y }, end];
  },
  "phone-analysis": (source, target) => elbowPoints(bottomCenter(source), topCenter(target), 600),
  "private-analysis": (source, target) => elbowPoints(bottomCenter(source), topCenter(target), 600),
  "customer-analysis": (source, target) => {
    const start = bottomCenter(source);
    const end = topCenter(target);
    return [start, { x: start.x, y: 600 }, { x: end.x, y: 600 }, end];
  },
  "overseas-whatsapp": (source, target) => elbowPoints(bottomCenter(source), topCenter(target), 405),
  "whatsapp-analysis": (source, target) => {
    const start = bottomCenter(source);
    const end = rightCenter(target);
    return [start, { x: start.x, y: end.y }, { x: end.x + 40, y: end.y }, end];
  },
};

function drawFlow(ctx: UniApp.CanvasContext & CanvasRenderingContext2D, progress: number) {
  clearCanvas(ctx);

  drawableEdges.value.forEach((edge, index) => {
    const points = routePoints(edge);
    if (points.length < 2) {
      return;
    }

    const color = edge.muted ? mutedColor : edge.color || activeColor;
    drawBaseLine(ctx, points, color, Boolean(edge.muted));
    drawArrow(ctx, points, color, Boolean(edge.muted));

    if (!edge.muted) {
      drawFlowDots(ctx, points, progress + index * 12);
    }
  });

  ctx.draw?.();
}

function clearCanvas(ctx: UniApp.CanvasContext & CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
}

function drawBaseLine(
  ctx: UniApp.CanvasContext & CanvasRenderingContext2D,
  points: Point[],
  color: string,
  muted: boolean,
) {
  ctx.save?.();
  ctx.beginPath();
  ctx.setLineWidth?.(muted ? 1.4 : 1.8);
  ctx.setStrokeStyle?.(color);
  ctx.strokeStyle = color;
  ctx.lineWidth = muted ? 1.4 : 1.8;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.moveTo(points[0].x, points[0].y);
  points.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
  ctx.stroke();
  ctx.restore?.();
}

function drawArrow(
  ctx: UniApp.CanvasContext & CanvasRenderingContext2D,
  points: Point[],
  color: string,
  muted: boolean,
) {
  const end = points[points.length - 1];
  const previous = [...points].reverse().find((point) => point.x !== end.x || point.y !== end.y);

  if (!previous) {
    return;
  }

  const angle = Math.atan2(end.y - previous.y, end.x - previous.x);
  const size = muted ? 9 : 11;

  ctx.save?.();
  ctx.beginPath();
  ctx.setFillStyle?.(color);
  ctx.fillStyle = color;
  ctx.moveTo(end.x, end.y);
  ctx.lineTo(end.x - size * Math.cos(angle - Math.PI / 6), end.y - size * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(end.x - size * Math.cos(angle + Math.PI / 6), end.y - size * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
  ctx.restore?.();
}

function drawFlowDots(
  ctx: UniApp.CanvasContext & CanvasRenderingContext2D,
  points: Point[],
  offset: number,
) {
  const total = pathLength(points);
  const spacing = 22;
  const start = offset % spacing;

  ctx.save?.();
  ctx.setFillStyle?.(activeColor);
  ctx.fillStyle = activeColor;
  ctx.shadowColor = "rgba(85, 207, 255, 0.8)";
  ctx.shadowBlur = 8;

  for (let distance = start; distance < total; distance += spacing) {
    const point = pointAtDistance(points, distance);
    ctx.beginPath();
    ctx.arc(point.x, point.y, 1.7, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore?.();
}

function pathLength(points: Point[]) {
  return points.slice(1).reduce((total, point, index) => {
    const previous = points[index];
    return total + Math.hypot(point.x - previous.x, point.y - previous.y);
  }, 0);
}

function pointAtDistance(points: Point[], distance: number): Point {
  let travelled = 0;

  for (let index = 1; index < points.length; index += 1) {
    const start = points[index - 1];
    const end = points[index];
    const segmentLength = Math.hypot(end.x - start.x, end.y - start.y);

    if (travelled + segmentLength >= distance) {
      const ratio = segmentLength === 0 ? 0 : (distance - travelled) / segmentLength;
      return {
        x: start.x + (end.x - start.x) * ratio,
        y: start.y + (end.y - start.y) * ratio,
      };
    }

    travelled += segmentLength;
  }

  return points[points.length - 1];
}

async function startFlowAnimation() {
  stopAnimation?.();
  await nextTick();
  await drawInstance.mount();
  await drawInstance.ready();

  const ctx = drawInstance.ctx as UniApp.CanvasContext & CanvasRenderingContext2D;
  const canvas = drawInstance.canvas;

  if (!ctx || !canvas) {
    return;
  }

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const requestFrame =
    canvas.requestAnimationFrame?.bind(canvas) ||
    ((callback: FrameRequestCallback) => setTimeout(callback, 1000 / 30));
  const cancelFrame =
    canvas.cancelAnimationFrame?.bind(canvas) ||
    ((id: number) => clearTimeout(id));
  let currentFrame = 0;

  const render = () => {
    currentFrame += 1;
    frameId = requestFrame(render) as number;
    drawFlow(ctx, currentFrame * 1.8);
  };

  render();
  stopAnimation = () => cancelFrame(frameId);
}

onMounted(() => {
  startFlowAnimation();
});

onBeforeUnmount(() => {
  stopAnimation?.();
});

watch(
  () => [props.nodes, props.edges],
  () => {
    startFlowAnimation();
  },
  { deep: true },
);
</script>

<style>
.key-metrics-desktop {
  position: relative;
  height: calc(100vh - 54px);
  overflow: hidden;
  color: #2d323a;
  background: #ffffff;
  display: flex;
  flex-direction: column;
}

.metrics-filter {
  position: absolute;
  top: 36px;
  left: 8px;
  z-index: 8;
  display: flex;
  align-items: center;
  gap: 8px;
}

.metrics-filter-label {
  color: #8d929a;
  font-size: 13px;
  line-height: 30px;
}

.metrics-filter-button {
  display: inline-flex;
  width: auto;
  min-width: 52px;
  height: 30px;
  margin: 0;
  padding: 0 17px;
  align-items: center;
  justify-content: center;
  color: #222936;
  font-size: 13px;
  line-height: 30px;
  background: #ffffff;
  border: 1px solid #1267ff;
  border-radius: 999px;
  box-shadow: none;
}

.metrics-filter-button::after {
  border: 0;
}

.metrics-filter-button--active {
  color: #ffffff;
  background: #1267ff;
  box-shadow: 0 8px 18px rgb(18 103 255 / 20%);
}

.metrics-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 28px;
}

.metrics-title {
  display: block;
  color: #2b3038;
  font-size: 36px;
  font-weight: 900;
  line-height: 1.25;
  letter-spacing: 8px;
}

.metrics-underline {
  display: block;
  width: 228px;
  height: 4px;
  margin-top: 7px;
  background: #1267ff;
  border-radius: 999px;
  box-shadow: 0 4px 10px rgb(18 103 255 / 22%);
}

.metrics-board {
  flex: 1;
  width: 100%;
  min-height: 0;
  padding-top: 18px;
  overflow: auto;
}

/* #ifdef H5 */
.metrics-board::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.metrics-board::-webkit-scrollbar-button,
.metrics-board::-webkit-scrollbar-button:vertical:start:decrement,
.metrics-board::-webkit-scrollbar-button:vertical:end:increment,
.metrics-board::-webkit-scrollbar-button:horizontal:start:decrement,
.metrics-board::-webkit-scrollbar-button:horizontal:end:increment {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
  background: transparent !important;
  -webkit-appearance: none;
}

.metrics-board::-webkit-scrollbar-track,
.metrics-board::-webkit-scrollbar-corner {
  background: transparent;
}

.metrics-board::-webkit-scrollbar-thumb {
  background: #d4d4d4;
  border-radius: 999px;
}
/* #endif */

.metrics-canvas-wrap {
  position: relative;
  width: 100%;
  height: 100%;
}

.metrics-flow-canvas {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.metrics-flow-svg {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
  width: 1400px;
  height: 730px;
  overflow: visible;
  pointer-events: none;
}

.metrics-svg-line {
  stroke: #55cfff;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
  filter: drop-shadow(0 0 4px rgb(85 207 255 / 34%));
}

.metrics-svg-line--muted {
  stroke: #d8dce3;
  stroke-width: 1.5;
  filter: none;
}

.metrics-svg-flow {
  stroke: #55cfff;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 2 20;
  filter: drop-shadow(0 0 7px rgb(85 207 255 / 86%));
  animation: metrics-svg-flow 2.4s linear infinite;
}

.metrics-node {
  position: absolute;
  z-index: 2;
  box-sizing: border-box;
  display: flex;
  padding: 18px 18px;
  overflow: visible;
  background: rgb(255 255 255 / 97%);
  border: 1px solid #edf0f4;
  border-radius: 14px;
  box-shadow: 0 8px 24px rgb(32 42 60 / 10%);
}

.metrics-node--large {
  align-items: center;
  gap: 20px;
  padding: 20px 26px;
  border-radius: 15px;
  box-shadow: 0 10px 28px rgb(32 42 60 / 12%);
}

.metrics-node--active {
  border: 2px solid #1267ff;
  box-shadow: 0 0 0 3px rgb(18 103 255 / 8%), 0 12px 28px rgb(18 103 255 / 22%);
}

.metrics-node--horizontal {
  align-items: center;
}

.metrics-node--horizontal .metrics-node-body {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 58px;
  height: 100%;
}

.metrics-node--horizontal .metrics-node-title {
  margin-bottom: 0;
  line-height: 1;
}

.metrics-node--horizontal .metrics-empty {
  height: auto;
  line-height: 1;
}

.metrics-node-title-vertical {
  width: 22px;
  color: #262b33;
  font-size: 15px;
  font-weight: 900;
  line-height: 1.2;
  text-align: center;
  letter-spacing: 2px;
  writing-mode: vertical-rl;
}

.metrics-node-body {
  flex: 1;
  min-width: 0;
}

.metrics-node-title {
  display: block;
  margin-bottom: 16px;
  color: #262b33;
  font-size: 15px;
  font-weight: 900;
  line-height: 1.2;
}

.metrics-groups {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px 38px;
}

.metrics-group,
.metrics-row {
  color: #8a919d;
  font-size: 11px;
  line-height: 1.25;
  white-space: nowrap;
}

.metrics-label {
  display: block;
  margin-bottom: 5px;
  color: #8b93a1;
}

.metrics-row {
  display: flex;
  align-items: baseline;
  margin-bottom: 9px;
}

.metrics-row-label {
  color: #8a919d;
}

.metrics-strong {
  color: #272d36;
  font-size: 12px;
  font-weight: 900;
}

.metrics-trend {
  margin-left: 4px;
  font-size: 12px;
  font-weight: 900;
}

.metrics-trend--up {
  color: #ff2638;
}

.metrics-trend--down {
  color: #43cc35;
}

.metrics-empty {
  display: flex;
  height: calc(100% - 25px);
  align-items: center;
  justify-content: center;
  color: #9aa2ad;
  font-size: 12px;
}

@keyframes metrics-svg-flow {
  from {
    stroke-dashoffset: 0;
  }

  to {
    stroke-dashoffset: -88;
  }
}
</style>
