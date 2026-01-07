<template>
  <template
    v-for="(route, index) in props.routes"
    :key="getRouteKey(route, index)"
  >
    <ElSubMenu
      v-if="hasChildren(route)"
      :teleported="false"
      :index="getRouteIndex(route, index)"
    >
      <template #title>
        {{ getRouteTitle(route) }}
      </template>
      <div :style="`max-height: calc(100vh - ${props.menuHeight || 0}px - 30px);overflow: auto`">
        <SubMenu :routes="route.children ?? []" />
      </div>
    </ElSubMenu>

    <ElMenuItem
      v-else
      :index="getRouteIndex(route, index)"
    >
      {{ getRouteTitle(route) }}
    </ElMenuItem>
  </template>
</template>

<script setup lang="ts">
import type { propsType, subMenuRouteType } from './_types'

import { ElMenuItem, ElSubMenu } from 'element-plus'

defineOptions({
  name: 'SubMenu',
  inheritAttrs: false,
})

const props = withDefaults(defineProps<propsType>(), {
  routes: () => [],
  menuHeight: 60,
})

function getRouteKey(route: subMenuRouteType, index: number): string {
  return route.path ?? `${index}`
}

function getRouteTitle(route: subMenuRouteType): string {
  const fallback = route.name ?? ''
  const metaTitle = route.meta?.title ?? ''
  return metaTitle || fallback
}

function getRouteIndex(route: subMenuRouteType, index: number): string {
  return route.path ?? `${index}`
}

function hasChildren(route: subMenuRouteType): boolean {
  return Array.isArray(route.children) && route.children.length > 0
}
</script>
