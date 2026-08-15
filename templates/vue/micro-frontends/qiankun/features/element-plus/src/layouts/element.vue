<template>
  <ElConfigProvider :empty-values="[undefined]">
    <div
      class="h-full"
      :class="{ 'h-screen!': !qiankunWindow.__POWERED_BY_QIANKUN__ }"
      :style="`--el-color-primary: ${themeColor || '#3A77FF'};`"
    >
      <ElContainer class="w-full h-full">
        <ElHeader
          v-if="!qiankunWindow.__POWERED_BY_QIANKUN__"
          class="headerbox"
          style="padding: 0"
          height="60"
        >
          <div class="w-full h-full bg-primary flex justify-center">
            <ElMenu :default-active="defaultTab" :ellipsis="false" mode="horizontal" router>
              <SubMenu :menu-height="60" :routes="routes" />
            </ElMenu>
          </div>
        </ElHeader>
        <ElMain>
          <ElContainer class="h-full w-full">
            <ElMain style="background-color: #fff">
              <RouterView v-slot="{ Component, route }">
                <transition name="fade" mode="out-in">
                  <keep-alive v-if="route.meta.keep">
                    <component :is="Component" :key="route.path" />
                  </keep-alive>
                  <component :is="Component" v-else :key="route.path" />
                </transition>
              </RouterView>
            </ElMain>
          </ElContainer>
        </ElMain>
      </ElContainer>
    </div>
  </ElConfigProvider>
</template>

<script lang="ts" setup>
import { ElConfigProvider, ElContainer, ElHeader, ElMain, ElMenu } from 'element-plus'
import { qiankunWindow } from 'vite-plugin-qiankun/dist/helper'
import { computed, reactive } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import SubMenu from '@/components/SubMenu'
import { useSystemStore } from '@/stores/modules/system'

const router = useRouter()
const routes = reactive(router.options.routes[0].children!)
const systemStore = useSystemStore()
const themeColor = computed(() => systemStore.themeColor)
const defaultTab = computed(() => router.currentRoute.value.path)
</script>

<style lang="scss" scoped>
:deep(.el-main) {
  --el-main-padding: 12px !important;
}
.bg-primary {
  background-color: var(--el-color-primary);
}
.headerbox {
  :deep(.el-menu) {
    background-color: var(--el-color-primary);

    .el-menu-item,
    .el-sub-menu {
      background-color: var(--el-color-primary);
      color: #fff !important;

      .el-sub-menu__title {
        background-color: var(--el-color-primary);
        color: #fff !important;
      }

      &.is-active,
      &:hover {
        background-color: #fff;
        color: var(--el-color-primary) !important;

        .el-sub-menu__title,
        .el-sub-menu__title:hover {
          background-color: #fff;
          color: var(--el-color-primary) !important;
        }
      }
    }

    &.el-menu--popup {
      background-color: #fff;

      .el-sub-menu,
      .el-menu-item {
        background-color: #fff !important;
        color: var(--el-color-primary) !important;

        .el-sub-menu__title {
          background-color: #fff;
          color: var(--el-color-primary) !important;
        }

        &.is-active,
        &:hover {
          background-color: var(--el-color-primary) !important;
          color: #fff !important;

          .el-sub-menu__title,
          .el-sub-menu__title:hover {
            background-color: var(--el-color-primary) !important;
            color: #fff !important;
          }
        }
      }
    }
  }
}
</style>
