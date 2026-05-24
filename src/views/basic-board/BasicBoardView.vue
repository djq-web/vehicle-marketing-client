<template>
  <main class="basic-board-page">
    <button class="back-button" type="button" @click="router.push('/')">
      返回首页
    </button>

    <section class="hero">
      <img class="hero-icon" :src="visualSrc" :alt="title" />
      <h1>{{ title }}</h1>
      <div class="underline"></div>
      <p>{{ subtitle }}</p>
    </section>

    <section class="metric-grid">
      <article v-for="card in cards" :key="card.label" class="metric-card">
        <span>{{ card.label }}</span>
        <strong>{{ card.value }}</strong>
        <small>{{ card.caption }}</small>
      </article>
    </section>
  </main>
</template>

<script setup lang="ts">
const router = useRouter();
const route = useRoute();

const visualMap: Record<string, string> = {
  brandStrategy: new URL("../../assets/svg/brand-strategy.svg", import.meta.url)
    .href,
  keyMetrics: new URL("../../assets/svg/key-metrics.svg", import.meta.url).href,
  marketingOperations: new URL(
    "../../assets/svg/marketing-operations.svg",
    import.meta.url,
  ).href,
};

const title = computed(() => String(route.meta.title || "看板"));
const subtitle = computed(() => String(route.meta.subtitle || "业务数据概览"));
const visualSrc = computed(
  () => visualMap[String(route.meta.visual)] || visualMap.brandStrategy,
);

const cards = [
  { label: "核心目标", value: "86%", caption: "本月达成率" },
  { label: "增长机会", value: "12", caption: "待推进事项" },
  { label: "风险预警", value: "3", caption: "需关注问题" },
];
</script>

<style scoped lang="scss">
.basic-board-page {
  min-height: 100vh;
  padding: 24px 32px 40px;
  background: #ffffff;
}

.back-button {
  position: absolute;
  top: 22px;
  left: 32px;
  height: 32px;
  padding: 0 16px;
  color: #1267ff;
  background: #eef5ff;
  border: 1px solid #c8ddff;
  border-radius: 999px;
}

.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 16px;

  h1 {
    margin: 10px 0 0;
    color: #2f333a;
    font-size: 28px;
    font-weight: 800;
    letter-spacing: 2px;
  }

  p {
    margin: 12px 0 0;
    color: #657084;
    font-size: 14px;
  }
}

.hero-icon {
  width: 92px;
  height: 72px;
  object-fit: contain;
  display: block;
}

.underline {
  width: 230px;
  height: 4px;
  margin-top: 8px;
  background: #1267ff;
  border-radius: 999px;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(180px, 1fr));
  gap: 24px;
  max-width: 920px;
  margin: 56px auto 0;
}

.metric-card {
  min-height: 132px;
  padding: 22px 24px;
  background: #f7faff;
  border: 1px solid #e1ecff;
  border-radius: 18px;
  box-shadow: 0 6px 18px rgb(35 88 164 / 8%);

  span,
  small {
    display: block;
    color: #657084;
    font-size: 13px;
  }

  strong {
    display: block;
    margin: 12px 0 8px;
    color: #162b4f;
    font-size: 34px;
    line-height: 1;
  }
}
</style>
