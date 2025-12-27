import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from './lang/en'
import zh from './lang/zh'

i18n.use(initReactI18next).init({
  resources: {
    zh: { translation: zh },
    en: { translation: en },
  },
  lng: localStorage.getItem('locale') || 'zh',
  fallbackLng: 'zh',
  interpolation: {
    escapeValue: false,
  },
})

export default i18n

