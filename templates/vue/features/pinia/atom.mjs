export default {
  id: 'vue:pinia',
  main: {
    imports: [
      'import { store } from \'@/stores\'',
    ],
    appUses: [
      'app.use(store)',
    ],
  },
}
