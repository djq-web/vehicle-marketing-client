<template>
  <button class="feature-card" type="button" :class="[{ active: feature.active }, `feature-card--${feature.variant}`]" @click="handleClick">
    <div class="feature-visual" aria-hidden="true">
      <span class="platform"></span>
      <span class="shape main"></span>
      <span class="shape accent"></span>
      <span class="shape tiny"></span>
    </div>
    <div class="feature-copy">
      <h3>{{ feature.title }}</h3>
      <p>{{ feature.description }}</p>
    </div>
  </button>
</template>

<script setup lang="ts">
import type { FeatureCard } from '../stores/home'

const props = defineProps<{
  feature: FeatureCard
}>()

const router = useRouter()

const handleClick = () => {
  if (props.feature.routeName) {
    router.push({ name: props.feature.routeName })
  }
}
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

  &.active {
    background: #f1f7ff;
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

.platform {
  position: absolute;
  bottom: 0;
  left: 12px;
  width: 60px;
  height: 29px;
  background: linear-gradient(145deg, #def2ff, #ffffff 58%, #cce4ff);
  border-bottom: 3px solid #65bfff;
  clip-path: polygon(50% 0, 100% 35%, 50% 70%, 0 35%);
  filter: drop-shadow(0 5px 5px rgb(30 132 255 / 18%));
}

.shape {
  position: absolute;
  display: block;
  background: linear-gradient(135deg, #7dd9ff 0%, #1279ff 72%);
  box-shadow: 0 8px 12px rgb(22 119 255 / 24%);
}

.feature-card--cube {
  .main {
    top: 1px;
    left: 33px;
    width: 22px;
    height: 22px;
    clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%);
  }

  .accent {
    top: 22px;
    left: 24px;
    width: 40px;
    height: 13px;
    clip-path: polygon(50% 0, 100% 40%, 50% 80%, 0 40%);
  }

  .tiny {
    top: 12px;
    left: 40px;
    width: 12px;
    height: 12px;
    background: #22d8ff;
  }
}

.feature-card--book,
.feature-card--report,
.feature-card--flag {
  .main {
    top: 0;
    left: 29px;
    width: 31px;
    height: 42px;
    border-radius: 4px;
    background: linear-gradient(135deg, #7ed6ff, #1582ff);
    transform: skewY(27deg);
  }

  .accent {
    top: 10px;
    left: 37px;
    width: 13px;
    height: 13px;
    border: 2px solid #bfeaff;
    border-radius: 50%;
    background: transparent;
  }

  .tiny {
    top: 22px;
    left: 51px;
    width: 12px;
    height: 2px;
    background: #ffffff;
  }
}

.feature-card--report {
  .main {
    left: 35px;
    width: 35px;
    height: 28px;
  }

  .accent {
    top: 15px;
    left: 28px;
    width: 16px;
    height: 16px;
    border: 0;
    border-radius: 3px;
    background: #18d3ff;
  }
}

.feature-card--flag {
  .main {
    left: 31px;
    width: 23px;
    height: 39px;
  }

  .accent {
    top: 13px;
    left: 46px;
    width: 14px;
    height: 20px;
    border: 0;
    border-radius: 2px;
    background: #0f75ff;
  }
}

.feature-card--diamond {
  .main {
    top: 4px;
    left: 25px;
    width: 43px;
    height: 33px;
    border-radius: 50% 50% 45% 45%;
    clip-path: polygon(50% 0, 96% 32%, 70% 100%, 30% 100%, 4% 32%);
  }

  .accent,
  .tiny {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #b6e5ff;
  }

  .accent {
    top: 1px;
    left: 23px;
  }

  .tiny {
    top: -2px;
    left: 57px;
  }
}

.feature-card--planet {
  .main {
    top: 3px;
    left: 27px;
    width: 41px;
    height: 41px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 30%, #85e2ff, #116cff 68%);
  }

  .accent {
    top: 5px;
    left: 21px;
    width: 50px;
    height: 30px;
    border: 2px solid #84d8ff;
    border-radius: 50%;
    background: transparent;
    transform: rotate(-18deg);
  }

  .tiny {
    top: -2px;
    left: 63px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #9ee5ff;
  }
}
</style>


