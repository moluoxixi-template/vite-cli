<template>
  <div class="min-h-screen bg-slate-100 font-sans text-slate-800">
    <header class="sticky top-0 z-20 flex min-h-[68px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-2 backdrop-blur md:px-8 xl:px-10">
      <div class="flex min-w-0 items-center gap-3">
        <span class="grid size-10 shrink-0 place-items-center rounded-md border border-slate-800 bg-slate-800 text-white max-[430px]:size-9" aria-hidden="true"><Boxes :size="22" /></span>
        <div>
          <h1 class="m-0 whitespace-nowrap text-lg font-semibold leading-6 max-[430px]:text-base">
            Vite 模板展厅
          </h1>
          <p class="m-0 mt-px text-xs leading-[18px] text-slate-500">
            {{ manifest?.count || 0 }} 个已验证组合
          </p>
        </div>
      </div>
      <div class="flex items-center gap-2.5">
        <ElTag v-if="manifest" class="max-[680px]:hidden!" effect="plain" type="info">
          {{ manifest.commit.slice(0, 7) }}
        </ElTag>
        <ElButton
          tag="a"
          class="max-[430px]:w-10! max-[430px]:px-2!"
          href="https://github.com/moluoxixi-template/vite-cli"
          target="_blank"
          rel="noreferrer"
          :icon="GitBranch"
        >
          <span class="max-[430px]:hidden">GitHub</span>
        </ElButton>
      </div>
    </header>

    <section class="flex gap-3 border-b border-slate-200 bg-white px-4 py-4 md:px-8 xl:px-10" aria-label="模板搜索">
      <ElInput
        v-model="filters.search"
        :prefix-icon="Search"
        clearable
        class="w-full max-w-[620px]"
        placeholder="搜索模板名称、框架或组件库"
      />
      <ElButton class="hidden! max-[900px]:inline-flex!" :icon="SlidersHorizontal" @click="filtersOpen = true">
        筛选
        <ElBadge v-if="activeFilterCount" :value="activeFilterCount" />
      </ElButton>
    </section>

    <main class="grid min-h-[calc(100vh-126px)] grid-cols-[260px_minmax(0,1fr)] max-[900px]:block">
      <aside class="border-r border-slate-200 bg-white py-[22px] pl-4 pr-5 md:pl-8 xl:pl-10 max-[900px]:hidden" aria-label="模板筛选">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="m-0 text-[15px] font-semibold leading-[22px]">
            筛选
          </h2>
          <ElButton v-if="activeFilterCount" link :icon="RotateCcw" @click="resetFilters">
            清空
          </ElButton>
        </div>
        <FilterPanel v-model="filters" :options="filterOptions" />
      </aside>

      <section class="min-w-0 px-4 pb-10 pt-5 md:pl-6 md:pr-8 xl:pr-10 max-[680px]:px-4 max-[430px]:px-3 max-[430px]:pb-7 max-[430px]:pt-3" aria-labelledby="results-heading">
        <div class="mb-3 flex min-h-9 items-center justify-between">
          <div class="flex items-baseline gap-2">
            <h2 id="results-heading" class="m-0 whitespace-nowrap text-[15px] font-semibold leading-[22px]">
              模板
            </h2>
            <span class="whitespace-nowrap text-[13px] text-slate-500">{{ filteredEntries.length }} 个结果</span>
          </div>
          <ElSelect v-model="pageSize" class="w-[108px]! max-[430px]:w-[100px]!" aria-label="每页数量">
            <ElOption :value="10" label="10 / 页" />
            <ElOption :value="20" label="20 / 页" />
            <ElOption :value="50" label="50 / 页" />
          </ElSelect>
        </div>

        <div v-if="loading" class="overflow-hidden rounded-md border border-slate-200 bg-white" aria-label="正在加载模板">
          <div v-for="index in 8" :key="index" class="block min-h-[76px] border-b border-slate-200 px-3.5 py-2 last:border-b-0">
            <ElSkeleton animated :rows="2" />
          </div>
        </div>

        <ElResult
          v-else-if="loadError"
          icon="error"
          title="模板清单加载失败"
          :sub-title="loadError"
        >
          <template #extra>
            <ElButton type="primary" @click="loadManifest">
              重新加载
            </ElButton>
          </template>
        </ElResult>

        <ElEmpty v-else-if="visibleEntries.length === 0" description="没有匹配的模板">
          <ElButton :icon="RotateCcw" @click="resetFilters">
            清空筛选
          </ElButton>
        </ElEmpty>

        <div v-else class="overflow-hidden rounded-md border border-slate-200 bg-white">
          <article v-for="entry in visibleEntries" :key="entry.slug" class="grid min-h-[76px] grid-cols-[34px_minmax(0,1fr)_58px_124px] items-center gap-3 border-b border-slate-200 px-3.5 py-2 last:border-b-0 hover:bg-slate-50 max-[680px]:min-h-0 max-[680px]:grid-cols-[32px_minmax(0,1fr)] max-[680px]:items-start max-[680px]:gap-x-3 max-[680px]:gap-y-2 max-[680px]:px-3">
            <div
              class="grid size-8 place-items-center rounded-md"
              :class="entry.config.framework === 'vue' ? 'bg-emerald-50 text-emerald-700' : 'bg-cyan-50 text-cyan-700'"
              aria-hidden="true"
            >
              <Triangle v-if="entry.config.framework === 'vue'" :size="21" />
              <Atom v-else :size="23" />
            </div>

            <div class="min-w-0">
              <a
                class="text-[15px] font-semibold leading-[22px] text-slate-900 no-underline hover:text-blue-600"
                :href="createArtifactUrl(entry.urls.demo, baseUrl)"
                target="_blank"
                rel="noreferrer"
              >
                {{ frameworkTitle(entry) }} · {{ uiLibraryTitle(entry) }}
              </a>
              <div class="flex flex-wrap gap-1.5 max-[680px]:max-h-7 max-[680px]:overflow-hidden">
                <ElTag size="small" effect="plain">
                  {{ runtimeLabel(entry) }}
                </ElTag>
                <ElTag size="small" effect="plain">
                  {{ routeLabel(entry) }}
                </ElTag>
                <ElTag size="small" effect="plain" type="warning">
                  {{ entry.config.packageManager }}
                </ElTag>
                <ElTag v-if="entry.config.i18n" size="small" effect="plain" type="success">
                  i18n
                </ElTag>
                <ElTag v-if="entry.config.sentry" size="small" effect="plain" type="success">
                  Sentry
                </ElTag>
                <ElTag v-if="entry.config.eslint" size="small" effect="plain" type="success">
                  ESLint
                </ElTag>
                <ElTag v-if="entry.config.husky" size="small" effect="plain" type="success">
                  Husky
                </ElTag>
              </div>
            </div>

            <div class="whitespace-nowrap text-right text-xs text-slate-500 max-[680px]:hidden">
              {{ formatBytes(entry.sizes.sourceZip) }}
            </div>

            <div class="flex items-center justify-end gap-1 max-[680px]:col-start-2 max-[680px]:justify-start max-[680px]:mt-0.5">
              <ElTooltip content="打开在线 Demo" placement="top">
                <ElButton
                  tag="a"
                  :href="createArtifactUrl(entry.urls.demo, baseUrl)"
                  target="_blank"
                  rel="noreferrer"
                  :icon="ExternalLink"
                  circle
                  aria-label="打开在线 Demo"
                />
              </ElTooltip>
              <ElTooltip content="下载源码 ZIP" placement="top">
                <ElButton
                  tag="a"
                  :href="createArtifactUrl(entry.urls.download, baseUrl)"
                  :download="`vite-template-${entry.slug}.zip`"
                  :icon="Download"
                  circle
                  aria-label="下载源码 ZIP"
                />
              </ElTooltip>
              <ElTooltip content="在 StackBlitz 中打开" placement="top">
                <ElButton
                  tag="a"
                  :href="createStackBlitzLaunchUrl(entry, baseUrl)"
                  target="_blank"
                  rel="noreferrer"
                  :icon="Code2"
                  circle
                  aria-label="在 StackBlitz 中打开"
                />
              </ElTooltip>
            </div>
          </article>
        </div>

        <ElPagination
          v-if="filteredEntries.length > pageSize"
          v-model:current-page="page"
          class="mt-[22px] justify-center"
          :page-size="pageSize"
          :total="filteredEntries.length"
          :pager-count="5"
          layout="prev, pager, next"
          background
        />
      </section>
    </main>

    <ElDrawer v-model="filtersOpen" title="筛选模板" size="min(360px, 88vw)">
      <FilterPanel v-model="filters" :options="filterOptions" />
      <template #footer>
        <ElButton :icon="RotateCcw" @click="resetFilters">
          清空
        </ElButton>
        <ElButton type="primary" @click="filtersOpen = false">
          查看 {{ filteredEntries.length }} 个结果
        </ElButton>
      </template>
    </ElDrawer>
  </div>
</template>

<script setup lang="ts">
import type { TemplateGalleryEntry, TemplateGalleryManifest } from '@cli/core/templateGallery'

import {
  Atom,
  Boxes,
  Code2,
  Download,
  ExternalLink,
  GitBranch,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Triangle,
} from '@lucide/vue'
import { computed, onMounted, ref, watch } from 'vue'

import { parseTemplateGalleryManifest } from '@cli/core/templateGallery'
import FilterPanel from '@/components/FilterPanel.vue'
import { useGalleryQuery } from '@/composables/useGalleryQuery'
import {
  createArtifactUrl,
  createGalleryFilterOptions,
  createStackBlitzLaunchUrl,
  filterGalleryEntries,
  formatBytes,
  getEntryRuntime,
} from '@/lib/gallery'

const manifest = ref<TemplateGalleryManifest>()
const loading = ref(true)
const loadError = ref('')
const filtersOpen = ref(false)
const { filters, page, pageSize, resetFilters } = useGalleryQuery()
const baseUrl = new URL(import.meta.env.BASE_URL, window.location.origin).href

const entries = computed(() => manifest.value?.entries || [])
const filterOptions = computed(() => createGalleryFilterOptions(entries.value))
const filteredEntries = computed(() => filterGalleryEntries(entries.value, filters))
const visibleEntries = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredEntries.value.slice(start, start + pageSize.value)
})
const activeFilterCount = computed(() => {
  return [
    filters.search,
    filters.framework,
    filters.uiLibrary,
    filters.runtime,
    filters.routeMode,
    filters.packageManager,
    filters.i18n === 'all' ? '' : filters.i18n,
    filters.sentry === 'all' ? '' : filters.sentry,
    filters.eslint === 'all' ? '' : filters.eslint,
    filters.husky === 'all' ? '' : filters.husky,
  ].filter(Boolean).length
})

watch(filteredEntries, (nextEntries) => {
  const lastPage = Math.max(1, Math.ceil(nextEntries.length / pageSize.value))
  page.value = Math.min(page.value, lastPage)
})

onMounted(loadManifest)

async function loadManifest(): Promise<void> {
  loading.value = true
  loadError.value = ''
  try {
    const response = await fetch(new URL('manifest.json', baseUrl))
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    manifest.value = parseTemplateGalleryManifest(await response.json())
  }
  catch (error) {
    loadError.value = error instanceof Error ? error.message : String(error)
  }
  finally {
    loading.value = false
  }
}

function frameworkTitle(entry: TemplateGalleryEntry): string {
  return entry.config.framework === 'vue' ? 'Vue 3' : 'React'
}

function uiLibraryTitle(entry: TemplateGalleryEntry): string {
  return entry.config.uiLibrary === 'element-plus' ? 'Element Plus' : 'Ant Design'
}

function routeLabel(entry: TemplateGalleryEntry): string {
  return entry.config.routeMode === 'pageRoutes' ? '文件系统路由' : '手动路由'
}

function runtimeLabel(entry: TemplateGalleryEntry): string {
  return getEntryRuntime(entry) === 'standard' ? 'Standard' : 'qiankun'
}
</script>
