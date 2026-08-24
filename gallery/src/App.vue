<template>
  <div class="gallery-shell">
    <header class="app-header">
      <div class="brand-lockup">
        <span class="brand-mark" aria-hidden="true"><Boxes :size="22" /></span>
        <div>
          <h1>Vite 模板展厅</h1>
          <p>{{ manifest?.count || 0 }} 个已验证组合</p>
        </div>
      </div>
      <div class="header-actions">
        <ElTag v-if="manifest" effect="plain" type="info">
          {{ manifest.commit.slice(0, 7) }}
        </ElTag>
        <ElButton
          tag="a"
          href="https://github.com/moluoxixi-template/vite-cli"
          target="_blank"
          rel="noreferrer"
          :icon="GitBranch"
        >
          GitHub
        </ElButton>
      </div>
    </header>

    <section class="search-band" aria-label="模板搜索">
      <ElInput
        v-model="filters.search"
        :prefix-icon="Search"
        clearable
        placeholder="搜索模板名称、框架或组件库"
      />
      <ElButton class="mobile-filter-button" :icon="SlidersHorizontal" @click="filtersOpen = true">
        筛选
        <ElBadge v-if="activeFilterCount" :value="activeFilterCount" />
      </ElButton>
    </section>

    <main class="catalog-layout">
      <aside class="desktop-filters" aria-label="模板筛选">
        <div class="filter-heading">
          <h2>筛选</h2>
          <ElButton v-if="activeFilterCount" link :icon="RotateCcw" @click="resetFilters">
            清空
          </ElButton>
        </div>
        <FilterPanel v-model="filters" :options="filterOptions" />
      </aside>

      <section class="results-panel" aria-labelledby="results-heading">
        <div class="results-toolbar">
          <div>
            <h2 id="results-heading">
              模板
            </h2>
            <span>{{ filteredEntries.length }} 个结果</span>
          </div>
          <ElSelect v-model="pageSize" class="page-size-select" aria-label="每页数量">
            <ElOption :value="24" label="24 / 页" />
            <ElOption :value="48" label="48 / 页" />
            <ElOption :value="96" label="96 / 页" />
          </ElSelect>
        </div>

        <div v-if="loading" class="result-list" aria-label="正在加载模板">
          <div v-for="index in 8" :key="index" class="template-item skeleton-item">
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

        <div v-else class="result-list">
          <article v-for="entry in visibleEntries" :key="entry.slug" class="template-item">
            <div class="framework-mark" :data-framework="entry.config.framework" aria-hidden="true">
              <Triangle v-if="entry.config.framework === 'vue'" :size="21" />
              <Atom v-else :size="23" />
            </div>

            <div class="template-copy">
              <a
                class="template-title"
                :href="createArtifactUrl(entry.urls.demo, baseUrl)"
                target="_blank"
                rel="noreferrer"
              >
                {{ frameworkTitle(entry) }} · {{ uiLibraryTitle(entry) }}
              </a>
              <p class="template-slug">
                {{ entry.slug }}
              </p>
              <div class="tag-row">
                <ElTag size="small" effect="plain">
                  {{ runtimeLabel(entry) }}
                </ElTag>
                <ElTag size="small" effect="plain">
                  {{ routeLabel(entry) }}
                </ElTag>
                <ElTag size="small" effect="plain" type="warning">
                  {{ entry.config.packageManager }}
                </ElTag>
                <ElTag size="small" effect="plain" :type="entry.config.i18n ? 'success' : 'info'">
                  {{ featureLabel('i18n', entry.config.i18n) }}
                </ElTag>
                <ElTag size="small" effect="plain" :type="entry.config.sentry ? 'success' : 'info'">
                  {{ featureLabel('Sentry', entry.config.sentry) }}
                </ElTag>
                <ElTag size="small" effect="plain" :type="entry.config.eslint ? 'success' : 'info'">
                  {{ featureLabel('ESLint', entry.config.eslint) }}
                </ElTag>
                <ElTag size="small" effect="plain" :type="entry.config.husky ? 'success' : 'info'">
                  {{ featureLabel('Husky', entry.config.husky) }}
                </ElTag>
              </div>
            </div>

            <div class="artifact-size">
              {{ formatBytes(entry.sizes.sourceZip) }}
            </div>

            <div class="template-actions">
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
          class="catalog-pagination"
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

function featureLabel(name: string, enabled: boolean): string {
  return `${name} ${enabled ? 'on' : 'off'}`
}
</script>
