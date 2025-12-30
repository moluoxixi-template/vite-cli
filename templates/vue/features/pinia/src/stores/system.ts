/**
 * 系统状态管理
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ThemeType = 'light' | 'dark'

export const useSystemStore = defineStore(
  'system',
  () => {
    /** 当前主题 */
    const theme = ref<ThemeType>('light')

    /** 当前语言 */
    const language = ref<string>('zh')

    /** 侧边栏折叠状态 */
    const sidebarCollapsed = ref<boolean>(false)

    /**
     * 设置主题
     * @param value 主题类型（'light' 或 'dark'）
     */
    function setTheme(value: ThemeType): void {
      theme.value = value
    }

    /**
     * 设置语言
     * @param value 语言代码（如 'zh', 'en', 'es'）
     */
    function setLanguage(value: string): void {
      language.value = value
    }

    /**
     * 切换侧边栏折叠状态
     */
    function toggleSidebar(): void {
      sidebarCollapsed.value = !sidebarCollapsed.value
    }

    return {
      theme,
      language,
      sidebarCollapsed,
      setTheme,
      setLanguage,
      toggleSidebar,
    }
  },
  {
    persist: {
      pick: ['theme', 'language', 'sidebarCollapsed'],
    },
  },
)
