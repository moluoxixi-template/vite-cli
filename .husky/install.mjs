import process from 'node:process';

if (process.env.CI === 'true') {
  process.exit(0);
}

const husky = (await import('husky')).default;
console.log(husky());
