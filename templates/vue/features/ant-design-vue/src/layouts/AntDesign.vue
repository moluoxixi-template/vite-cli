<script setup lang="ts">
/**
 * Ant Design Vue 布局组件
 */
import { ref } from 'vue';

const sidebarCollapsed = ref(false);

function toggleSidebar(): void {
  sidebarCollapsed.value = !sidebarCollapsed.value;
}
</script>

<template>
  <a-layout class="layout-container">
    <a-layout-sider
      v-model:collapsed="sidebarCollapsed"
      collapsible
      :trigger="null"
      class="layout-sider"
    >
      <div class="logo">
        <span v-if="!sidebarCollapsed">Logo</span>
      </div>
      <a-menu theme="dark" mode="inline" :default-selected-keys="['1']">
        <a-menu-item key="1">
          <span>首页</span>
        </a-menu-item>
        <a-menu-item key="2">
          <span>关于</span>
        </a-menu-item>
      </a-menu>
    </a-layout-sider>
    <a-layout>
      <a-layout-header class="layout-header">
        <a-button @click="toggleSidebar">
          {{ sidebarCollapsed ? '展开' : '折叠' }}
        </a-button>
      </a-layout-header>
      <a-layout-content class="layout-content">
        <slot />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<style scoped lang="scss">
.layout-container {
  height: 100vh;
}

.layout-sider {
  overflow: auto;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
}

.logo {
  height: 32px;
  margin: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
}

.layout-header {
  background: #fff;
  padding: 0 16px;
  display: flex;
  align-items: center;
}

.layout-content {
  margin: 24px 16px;
  padding: 24px;
  background: #fff;
  min-height: 280px;
}
</style>

