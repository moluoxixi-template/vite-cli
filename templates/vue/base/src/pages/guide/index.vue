<template>
  <div class="guide-page">
    <h1>指南</h1>
    <p>这是一级菜单页面</p>
    <RouterView />
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<route lang="json">
{
  "meta": {
    "title": "指南"
  }
}
</route>
