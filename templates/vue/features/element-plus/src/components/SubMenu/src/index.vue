<template>
  <template
    v-for="(route, index) in menuRoutes"
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
      <SubMenu
        :parent-path="getRouteIndex(route, index)"
        :routes="route.children ?? []"
      />
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
import type { propsType, subMenuRouteType } from './types'

import { ElMenuItem, ElSubMenu } from 'element-plus'
import { computed } from 'vue'

defineOptions({
  name: 'SubMenu',
  inheritAttrs: false,
})

const props = withDefaults(defineProps<propsType>(), {
  routes: () => [],
})

const menuRoutes = computed(() => createMenuTree(props.routes))

function createMenuTree(routes: subMenuRouteType[]): subMenuRouteType[] {
  const routeNodes = routes.map(route => ({
    ...route,
    children: route.children ? createMenuTree(route.children) : undefined,
  }))
  const absoluteRoutes = new Map<string, subMenuRouteType>()
  const nestedPaths = new Set<string>()

  for (const route of routeNodes) {
    const path = normalizeAbsolutePath(route.path)
    if (path) {
      absoluteRoutes.set(path, route)
    }
  }

  for (const [path, route] of absoluteRoutes) {
    let parentPath = ''
    for (const candidatePath of absoluteRoutes.keys()) {
      if (
        candidatePath !== '/'
        && path.startsWith(`${candidatePath}/`)
        && candidatePath.length > parentPath.length
      ) {
        parentPath = candidatePath
      }
    }

    if (!parentPath) {
      continue
    }

    const parentRoute = absoluteRoutes.get(parentPath)
    if (parentRoute) {
      parentRoute.children ??= []
      parentRoute.children.push(route)
      nestedPaths.add(path)
    }
  }

  return routeNodes.filter((route) => {
    const path = normalizeAbsolutePath(route.path)
    return !path || !nestedPaths.has(path)
  })
}

function normalizeAbsolutePath(path?: string): string {
  if (!path?.startsWith('/')) {
    return ''
  }

  return path.replace(/\/+/g, '/').replace(/\/$/, '') || '/'
}

function getRouteKey(route: subMenuRouteType, index: number): string {
  return route.path ?? `${index}`
}

function getRouteTitle(route: subMenuRouteType): string {
  const fallback = route.name ? String(route.name) : ''
  const metaTitle = typeof route.meta?.title === 'string' ? route.meta.title : ''
  return metaTitle || fallback
}

function getRouteIndex(route: subMenuRouteType, index: number): string {
  const routePath = route.path ?? `${index}`
  if (routePath.startsWith('/')) {
    return routePath
  }

  const parentPath = props.parentPath || '/'
  return `${parentPath}/${routePath}`.replace(/\/+/g, '/').replace(/\/$/, '') || '/'
}

function hasChildren(route: subMenuRouteType): boolean {
  return Array.isArray(route.children) && route.children.length > 0
}
</script>
