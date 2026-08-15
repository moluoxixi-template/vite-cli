export default {
  id: 'react:pageRoutes',
  vite: {
    imports: [
      'import Pages from \'vite-plugin-pages\'',
    ],
    plugins: [
      `plugins.push(Pages({
  resolver: 'react',
  dirs: 'src/pages',
  extensions: ['tsx'],
  exclude: ['**/components/**', '**/__tests__/**'],
}))`,
    ],
  },
}
