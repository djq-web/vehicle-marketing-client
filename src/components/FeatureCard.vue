<template>
  <div class="feature-card" :class="[{ active: feature.active }, `feature-card--${feature.variant}`]">
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
  </div>
</template>

<script setup lang="ts">
import type { FeatureCard } from '@/stores/home'

defineProps<{
  feature: FeatureCard
}>()
</script>
