import { createI18n } from 'vue-i18n'

import en from './lang/en'
import es from './lang/es'
import zh from './lang/zh'

const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('locale') || 'zh',
  fallbackLocale: 'zh',
  messages: {
    zh,
    en,
    es,
  },
})

export default i18n
