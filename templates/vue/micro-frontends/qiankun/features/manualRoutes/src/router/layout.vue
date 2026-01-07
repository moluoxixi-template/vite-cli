<template>
  <component :is="layout" />
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import layouts from '@/layouts'
import { useSystemStore } from '@/stores/modules/system'

const systemInfo = useSystemStore()
const layoutType = computed(() => systemInfo.layout)
const layout = computed(() => layouts[layoutType.value])
</script>

<style lang="scss" scoped></style>
