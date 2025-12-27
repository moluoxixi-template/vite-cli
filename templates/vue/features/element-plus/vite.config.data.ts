import type { ViteConfigData } from '../../../../src/types/viteConfig'

const data: ViteConfigData = {
  css: {
    additionalData: `additionalData: (source: string, filename: string) => {
                if (filename.includes('assets/styles/element/index.scss')) {
                  return \`$namespace: '\${appCode || 'el'}';
                \${source}\`
                }
                return source
              },`,
  },
}

export default data
