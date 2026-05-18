// esbuild.config.mjs
import { build } from 'esbuild';
import { rmSync } from 'node:fs';

rmSync('dist', { recursive: true, force: true });

await build({
  entryPoints: ['src/handler.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  outfile: 'dist/handler.js',
  sourcemap: false,
  minify: true,
  external: ['@aws-sdk/*'],
  logLevel: 'info',
});

console.log('Build complete: dist/handler.js');
