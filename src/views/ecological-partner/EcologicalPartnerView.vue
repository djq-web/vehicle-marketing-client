<template>
  <main class="partner-page">
    <button class="back-button" type="button" @click="router.push('/')">
      返回首页
    </button>
    <section class="hero">
      <h1>生态伙伴看板</h1>
      <div class="underline"></div>
    </section>

    <section class="partner-grid">
      <button
        v-for="card in partnerCards"
        :key="card.title"
        class="partner-card"
        type="button"
      >
        <div class="image-wrap">
          <img :src="card.image" :alt="card.title" />
        </div>
        <p>{{ card.title }}</p>
      </button>
    </section>
  </main>
</template>

<script setup lang="ts">
const router = useRouter();

const partnerCards = [
  {
    title: "平台投流",
    image: new URL(
      "../../assets/svg/platform-traffic-distribution.svg",
      import.meta.url
    ).href,
  },
  {
    title: "产品拍摄",
    image: new URL("../../assets/svg/product-photography.svg", import.meta.url)
      .href,
  },
  {
    title: "短视频制作",
    image: new URL(
      "../../assets/svg/short-video-production.svg",
      import.meta.url
    ).href,
  },
  {
    title: "独立站建设",
    image: new URL(
      "../../assets/svg/independent-website-construction.svg",
      import.meta.url
    ).href,
  },
];
</script>

<style scoped lang="scss">
.partner-page {
  min-height: 100vh;
  padding: 24px 32px 40px;
  background: #fff;
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
  margin-top: 6px;

  h1 {
    margin: 0;
    color: #2f333a;
    font-size: 28px;
    font-weight: 800;
    letter-spacing: 2px;
  }
}

.underline {
  width: 230px;
  height: 4px;
  margin-top: 8px;
  background: #1267ff;
  border-radius: 999px;
}

.partner-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(180px, 1fr));
  gap: 32px;
  max-width: 1180px;
  margin: 60px auto 0;
}

.partner-card {
  padding: 12px 12px 18px;
  background: #fff;
  border: 1px solid #edf0f4;
  border-radius: 22px;
  box-shadow: 0 2px 10px rgb(32 45 66 / 8%);
  transition: box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease;

  &:hover {
    border-color: #2e72ff;
    box-shadow: 0 0 0 1px #2e72ff, 0 12px 30px rgb(18 103 255 / 14%);
  }

  p {
    margin: 18px 0 0;
    color: #333;
    font-size: 18px;
    font-weight: 800;
    text-align: center;
  }
}

.image-wrap {
  height: 215px;
  padding: 0;
  overflow: hidden;
  background: #f6f7f9;
  border-radius: 18px;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
}
</style>
