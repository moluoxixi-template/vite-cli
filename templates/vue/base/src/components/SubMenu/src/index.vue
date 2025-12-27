<script setup lang="ts">
/**
 * SubMenu 子菜单组件
 * 递归渲染菜单
 */
import type { SubMenuProps } from './_types';

defineProps<SubMenuProps>();
</script>

<template>
  <template v-for="item in menuList" :key="item.path">
    <el-sub-menu v-if="item.children?.length" :index="item.path">
      <template #title>
        <span>{{ item.meta?.title }}</span>
      </template>
      <SubMenu :menu-list="item.children" />
    </el-sub-menu>
    <el-menu-item v-else :index="item.path">
      <span>{{ item.meta?.title }}</span>
    </el-menu-item>
  </template>
</template>

