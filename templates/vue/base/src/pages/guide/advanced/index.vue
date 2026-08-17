<template>
  <div class="advanced-page">
    <h2>进阶</h2>
    <p>这是二级菜单页面</p>
    <RouterView />
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<route lang="json">
{
  "meta": {
    "title": "进阶"
  }
}
</route>
