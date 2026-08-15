export default {
  id: 'react:qiankun',
  main: {
    mode: 'react-qiankun',
    imports: [
      'import type { QiankunProps } from \'@/types/qiankun\'',
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
