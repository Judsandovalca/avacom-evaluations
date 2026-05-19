// esbuild.config.mjs
import { build, context } from 'esbuild';
import { rmSync } from 'node:fs';

const watch = process.argv.includes('--watch');

rmSync('dist', { recursive: true, force: true });

const config = {
  entryPoints: ['src/handler.ts'],
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'cjs',
  outfile: 'dist/handler.js',
  sourcemap: watch,
  minify: !watch,
  external: ['@aws-sdk/*'],
  logLevel: 'info',
};

if (watch) {
  const ctx = await context(config);
  await ctx.watch();
  console.log('esbuild watching src/ — rebuilds on change.');
} else {
  await build(config);
  console.log('Build complete: dist/handler.js');
}
