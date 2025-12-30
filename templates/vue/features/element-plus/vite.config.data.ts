import type { ViteConfigData } from '../../../../src/types/viteConfig'

const data: ViteConfigData = {
  hooks: {
    'css.preprocessorOptions.scss.additionalData': `(source: string, filename: string) => {
      if (filename.includes('assets/styles/element/index.scss')) {
        return \`$namespace: '\${appCode || 'el'}';
\${source}\`
      }
      else {
        return source
      }
    }`,
  },
}

export default data
