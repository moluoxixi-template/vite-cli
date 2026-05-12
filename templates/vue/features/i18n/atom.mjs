export default {
  id: 'vue:i18n',
  main: {
    imports: [
      'import i18n from \'@/locales\'',
    ],
    appUses: [
      'app.use(i18n)',
    ],
  },
}
