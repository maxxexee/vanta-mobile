#!/usr/bin/env node
// Publish the wallet app with the site, in one folder.
//
// The landing page was the only thing ever deployed, so `vanta-mobile.xyz` had
// no wallet on it: a desktop visitor saw a marketing page, a download link and
// nothing to open. The app itself is a separate Vite project and nothing joined
// the two.
//
// This joins them. The app builds with `base: './'`, so its assets resolve
// relative to whatever path it lands on, which is what makes `/app/` work
// without a rebuild flag. Upload `landing/dist` and both are live.
import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const appDist = join(root, 'dist')
const landingDist = join(root, 'landing', 'dist')
const appTarget = join(landingDist, 'app')

const run = (cmd, args, cwd) =>
  execFileSync(cmd, args, { cwd, stdio: 'inherit', shell: process.platform === 'win32' })

console.log('› building the wallet app')
run('npm', ['run', 'build'], root)

console.log('› building the landing page')
run('npm', ['run', 'build'], join(root, 'landing'))

if (!existsSync(join(appDist, 'index.html'))) {
  console.error('the app build produced no dist/index.html — nothing to copy')
  process.exit(1)
}
if (!existsSync(join(landingDist, 'index.html'))) {
  console.error('the landing build produced no dist/index.html — nothing to copy')
  process.exit(1)
}

// Replace rather than merge: a stale asset from an older app build would be
// served forever beside the new one, because Vite's filenames are content-hashed
// and nothing would overwrite it.
rmSync(appTarget, { recursive: true, force: true })
cpSync(appDist, appTarget, { recursive: true })

console.log(`› app copied to ${appTarget}`)
console.log(`\nUpload ${landingDist} as the site root.`)
console.log('  /       the landing page')
console.log('  /app/   the wallet (Phantom/Solflare connect, or create a wallet)')
