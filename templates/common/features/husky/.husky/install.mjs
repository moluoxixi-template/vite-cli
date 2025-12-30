// Skip Husky install in production and CI
import process from 'node:process'

if (process.env.NODE_ENV === 'production' || process.env.CI === 'true') {
  process.exit(0)
}
// eslint-disable-next-line antfu/no-top-level-await
const husky = (await import('husky')).default
console.log(husky())
