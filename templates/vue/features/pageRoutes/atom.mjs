export default {
  id: 'vue:pageRoutes',
  vite: {
    imports: [
      'import Pages from \'vite-plugin-pages\'',
    ],
    plugins: [
      `plugins.push(Pages({
  dirs: 'src/pages',
  extensions: ['vue'],
  exclude: ['**/components/**', '**/__tests__/**'],
}))`,
    ],
  },
}
