import * as esbuild from 'esbuild'
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'fs'

const isWatch = process.argv.includes('--watch')
const isDev = process.argv.includes('--dev') || isWatch

const outdir = 'dist'

// Ensure output directory
if (!existsSync(outdir)) mkdirSync(outdir, { recursive: true })

const baseConfig = {
  bundle: true,
  minify: !isDev,
  sourcemap: isDev,
  target: ['chrome120'],
  format: 'iife',
  loader: { '.js': 'js' },
  define: {
    'process.env.NODE_ENV': JSON.stringify(isDev ? 'development' : 'production')
  }
}

/** @type {esbuild.BuildOptions[]} */
const builds = [
  // Content script — injected into pages, must be IIFE
  {
    ...baseConfig,
    entryPoints: ['src/content.js'],
    outfile: `${outdir}/content.js`
  },
  // Background service worker — ES module
  {
    ...baseConfig,
    entryPoints: ['src/background.js'],
    outfile: `${outdir}/background.js`,
    format: 'esm'
  },
  // Popup
  {
    ...baseConfig,
    entryPoints: ['src/popup/popup.js'],
    outfile: `${outdir}/popup.js`
  },
  // Options page
  {
    ...baseConfig,
    entryPoints: ['src/options/options.js'],
    outfile: `${outdir}/options.js`
  }
]

async function build() {
  try {
    const start = Date.now()
    await Promise.all(builds.map(cfg => esbuild.build(cfg)))
    console.log(`Built in ${Date.now() - start}ms`)
  } catch (e) {
    console.error('Build failed:', e)
    if (!isWatch) process.exit(1)
  }
}

// Copy static files
function copyStatic() {
  const files = [
    'manifest.json',
    'src/popup/popup.html',
    'src/options/options.html',
    'src/popup/popup.css',
    'src/options/options.css'
  ]
  const assets = ['icon16.png', 'icon48.png', 'icon128.png']

  for (const file of files) {
    const src = file.replace('src/', 'src/')
    if (existsSync(file)) {
      const dest = `${outdir}/${file.replace('src/popup/', '').replace('src/options/', '')}`
      copyFileSync(file, dest)
    }
  }

  for (const asset of assets) {
    if (existsSync(`assets/${asset}`)) {
      copyFileSync(`assets/${asset}`, `${outdir}/${asset}`)
    }
  }
}

if (isWatch) {
  const ctx = await esbuild.context({
    ...baseConfig,
    entryPoints: [
      'src/content.js',
      'src/background.js',
      'src/popup/popup.js',
      'src/options/options.js'
    ],
    outdir
  })
  await ctx.watch()
  console.log('Watching for changes...')
} else {
  await build()
  copyStatic()
}
