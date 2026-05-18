<template>
  <button class="feature-card" type="button" @click="handleClick">
    <div class="feature-visual" aria-hidden="true">
      <img class="feature-svg" :src="featureVisualSrc" :alt="feature.title" />
    </div>
    <div class="feature-copy">
      <h3>{{ feature.title }}</h3>
      <p>{{ feature.description }}</p>
    </div>
  </button>
</template>

<script setup lang="ts">
import type { FeatureCard } from "../stores/home";

const props = defineProps<{
  feature: FeatureCard;
}>();

const router = useRouter();

const featureVisualMap = {
  cube: new URL("../../../assets/svg/brand-strategy.svg", import.meta.url).href,
  book: new URL("../../../assets/svg/key-metrics.svg", import.meta.url).href,
  report: new URL(
    "../../../assets/svg/marketing-operations.svg",
    import.meta.url
  ).href,
  flag: new URL("../../../assets/svg/marketing-calendar.svg", import.meta.url)
    .href,
  diamond: new URL("../../../assets/svg/market-feedback.svg", import.meta.url)
    .href,
  planet: new URL("../../../assets/svg/ecological-partner.svg", import.meta.url)
    .href,
} as const;

const featureVisualSrc = computed(
  () => featureVisualMap[props.feature.variant]
);

const handleClick = () => {
  if (props.feature.routeName) {
    router.push({ name: props.feature.routeName });
  }
};
</script>

<style scoped lang="scss">
.feature-card {
  position: relative;
  width: 136px;
  height: 74px;
  padding: 34px 17px 11px;
  background: #f0f5fd;
  border-radius: 10px;
  transition: 0.2s ease;

  &:hover {
    border-color: rgba(203, 222, 253, 1);
    box-shadow: 0 0 0 1px #cfe3ff, 0 5px 14px rgb(43 133 255 / 22%);
  }

  h3 {
    margin: 0 0 3px;
    color: #1f2733;
    font-size: 12px;
    font-weight: 800;
  }

  p {
    margin: 0;
    color: #647083;
    font-size: 9px;
  }
}

.feature-visual {
  position: absolute;
  top: -25px;
  left: 50%;
  width: 84px;
  height: 58px;
  transform: translateX(-50%);
}

.feature-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}
</style>
