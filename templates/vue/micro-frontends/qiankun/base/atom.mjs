export default {
  id: 'vue:qiankun',
  main: {
    mode: 'vue-qiankun',
    imports: [
      'import { qiankunWindow, renderWithQiankun } from \'vite-plugin-qiankun/dist/helper\'',
    ],
  },
  vite: {
    imports: [
      'import qiankun from \'vite-plugin-qiankun\'',
    ],
    plugins: [
      `plugins.push(qiankun(appCode || 'app', {
  useDevMode: mode === 'development',
}))`,
    ],
  },
}
