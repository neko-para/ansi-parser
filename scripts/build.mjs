import { build } from 'esbuild'

build({
  entryPoints: ['src/index.ts'],
  outdir: 'dist/esm',
  format: 'esm',
  platform: 'neutral',
  mainFields: ['module', 'browser', 'main'],
  bundle: true
})

build({
  entryPoints: ['src/index.ts'],
  outdir: 'dist/cjs',
  format: 'cjs',
  platform: 'neutral',
  mainFields: ['main', 'module'],
  bundle: true
})
