<template>
  <div class="w-full">
    <ElForm label-position="top">
      <ElFormItem label="框架">
        <ElSelect v-model="model.framework" clearable placeholder="全部框架">
          <ElOption
            v-for="value in options.frameworks"
            :key="value"
            :label="displayLabel(value)"
            :value="value"
          />
        </ElSelect>
      </ElFormItem>

      <ElFormItem label="组件库">
        <ElSelect v-model="model.uiLibrary" clearable placeholder="全部组件库">
          <ElOption
            v-for="value in options.uiLibraries"
            :key="value"
            :label="displayLabel(value)"
            :value="value"
          />
        </ElSelect>
      </ElFormItem>

      <ElFormItem label="运行方式">
        <ElSelect v-model="model.runtime" clearable placeholder="全部运行方式">
          <ElOption
            v-for="value in options.runtimes"
            :key="value"
            :label="displayLabel(value)"
            :value="value"
          />
        </ElSelect>
      </ElFormItem>

      <ElFormItem label="路由">
        <ElSelect v-model="model.routeMode" clearable placeholder="全部路由">
          <ElOption
            v-for="value in options.routeModes"
            :key="value"
            :label="displayLabel(value)"
            :value="value"
          />
        </ElSelect>
      </ElFormItem>

      <ElFormItem label="包管理器">
        <ElSelect v-model="model.packageManager" clearable placeholder="全部包管理器">
          <ElOption
            v-for="value in options.packageManagers"
            :key="value"
            :label="displayLabel(value)"
            :value="value"
          />
        </ElSelect>
      </ElFormItem>

      <div class="grid grid-cols-2 gap-x-2.5">
        <ElFormItem label="i18n">
          <ElSelect v-model="model.i18n">
            <ElOption v-for="option in toggleOptions" :key="option.value" v-bind="option" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="Sentry">
          <ElSelect v-model="model.sentry">
            <ElOption v-for="option in toggleOptions" :key="option.value" v-bind="option" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="ESLint">
          <ElSelect v-model="model.eslint">
            <ElOption v-for="option in toggleOptions" :key="option.value" v-bind="option" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="Husky">
          <ElSelect v-model="model.husky">
            <ElOption v-for="option in toggleOptions" :key="option.value" v-bind="option" />
          </ElSelect>
        </ElFormItem>
      </div>
    </ElForm>
  </div>
</template>

<script setup lang="ts">
import type { GalleryFilterOptions, GalleryFilters } from '@/types'

defineProps<{
  options: GalleryFilterOptions
}>()

const model = defineModel<GalleryFilters>({ required: true })

const toggleOptions = [
  { label: '全部', value: 'all' },
  { label: '启用', value: 'on' },
  { label: '关闭', value: 'off' },
]

function displayLabel(value: string): string {
  const labels: Record<string, string> = {
    'vue': 'Vue 3',
    'react': 'React',
    'element-plus': 'Element Plus',
    'ant-design': 'Ant Design',
    'standard': 'Standard',
    'qiankun': 'qiankun',
    'pageRoutes': '文件系统路由',
    'manualRoutes': '手动路由',
    'pnpm': 'pnpm',
    'npm': 'npm',
    'yarn': 'Yarn',
  }
  return labels[value] || value
}
</script>
