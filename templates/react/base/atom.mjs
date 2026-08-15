export default {
  id: 'react:base',
  main: {
    mode: 'react-standard',
    imports: [
      'import { StrictMode } from \'react\'',
      'import { createRoot } from \'react-dom/client\'',
      'import { RouterProvider } from \'react-router-dom\'',
      'import { createRouter } from \'@/router\'',
      '',
      'import \'@/assets/styles/main.scss\'',
      'import \'@/assets/fonts/index.css\'',
    ],
  },
  vite: {
    imports: [
      'import react from \'@vitejs/plugin-react\'',
    ],
    pluginsByMainMode: {
      'react-standard': [
        'plugins.push(react())',
      ],
      'react-qiankun': [
        `if (mode !== 'development') {
  plugins.push(react())
}`,
      ],
    },
  },
}
