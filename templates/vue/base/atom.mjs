export default {
  id: 'vue:base',
  main: {
    mode: 'vue-standard',
    imports: [
      'import { createApp } from \'vue\'',
      'import directives from \'@/directives\'',
      'import App from \'@/App.vue\'',
      'import getRouter from \'@/router\'',
      '',
      'import \'@/assets/styles/main.scss\'',
      'import \'@/assets/fonts/index.css\'',
    ],
    appSetup: [
      'directives(app)',
    ],
  },
  vite: {
    imports: [
      'import vue from \'@vitejs/plugin-vue\'',
    ],
    plugins: [
      'plugins.push(vue())',
    ],
  },
}
