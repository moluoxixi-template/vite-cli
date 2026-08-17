<template>
  <ElConfigProvider :empty-values="[undefined]">
    <div
      class="h-full"
      :class="{ 'h-screen!': !qiankunWindow.__POWERED_BY_QIANKUN__ }"
      :style="{
        '--el-color-primary': themeColor || '#3A77FF',
      }"
    >
      <ElContainer class="w-full h-full">
        <ElHeader
          v-if="!qiankunWindow.__POWERED_BY_QIANKUN__"
          style="--el-header-padding: 0"
        >
          <ElMenu :default-active="defaultTab" :ellipsis="false" mode="horizontal" router>
            <SubMenu :routes="routes" />
          </ElMenu>
        </ElHeader>
        <ElMain>
          <ElContainer class="h-full w-full">
            <ElMain>
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
