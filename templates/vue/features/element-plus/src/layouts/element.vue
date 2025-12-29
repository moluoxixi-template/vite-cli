<script setup lang="ts">
/**
 * Element Plus 布局组件
 */
import { ref } from 'vue';

const sidebarCollapsed = ref(false);

function toggleSidebar(): void {
  sidebarCollapsed.value = !sidebarCollapsed.value;
}
</script>

<template>
  <el-container class="layout-container">
    <el-aside :width="sidebarCollapsed ? '64px' : '200px'" class="layout-aside">
      <div class="logo">
        <span v-if="!sidebarCollapsed">Logo</span>
      </div>
      <el-menu
        :collapse="sidebarCollapsed"
        default-active="1"
        class="layout-menu"
      >
        <el-menu-item index="1">
          <template #title>首页</template>
        </el-menu-item>
        <el-menu-item index="2">
          <template #title>关于</template>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="layout-header">
        <el-button @click="toggleSidebar">
          {{ sidebarCollapsed ? '展开' : '折叠' }}
        </el-button>
      </el-header>
      <el-main class="layout-main">
        <slot />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped lang="scss">
.layout-container {
  height: 100vh;
}

.layout-aside {
  background-color: #304156;
  transition: width 0.3s;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 20px;
  font-weight: bold;
}

.layout-menu {
  border-right: none;
}

.layout-header {
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  display: flex;
  align-items: center;
}

.layout-main {
  background-color: #f0f2f5;
}
</style>

