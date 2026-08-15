export default {
  id: 'vue:element-plus',
  main: {
    imports: [
      'import \'@/assets/styles/element/index.scss\'',
    ],
  },
  vite: {
    imports: [
      'import AutoImport from \'unplugin-auto-import/vite\'',
      'import Components from \'unplugin-vue-components/vite\'',
      'import { ElementPlusResolver } from \'unplugin-vue-components/resolvers\'',
    ],
    plugins: [
      `plugins.push(AutoImport({
  imports: ['vue'],
  resolvers: [ElementPlusResolver()],
  dts: 'typings/auto-imports.d.ts',
}))`,
      `plugins.push(Components({
  resolvers: [ElementPlusResolver()],
  globs: [],
  dts: 'typings/components.d.ts',
}))`,
    ],
  },
}
