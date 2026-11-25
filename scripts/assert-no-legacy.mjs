#!/usr/bin/env node
/**
 * Fails the build if the retired React UI is back in the working tree.
 *
 * The old app is preserved at tag `legacy-ui-2026-11-23`, not on disk. Keeping
 * it out of the tree is deliberate: when both UIs existed, the shortest path to
 * "make the new design work" was always to edit the old one. There is now
 * nothing to edit.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const failures = []

if (existsSync(join(root, 'src'))) failures.push('src/ still exists')
if (existsSync(join(root, 'index.html'))) failures.push('root index.html still exists')
if (!existsSync(join(root, 'web/index.html'))) failures.push('web/index.html is missing')
if (!existsSync(join(root, 'web/onboarding.html'))) failures.push('web/onboarding.html is missing')

const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
for (const dep of ['react', 'react-dom', '@vitejs/plugin-react']) {
  if (pkg.dependencies?.[dep] || pkg.devDependencies?.[dep]) {
    failures.push(`${dep} is still a dependency`)
  }
}

// Assets that only work online. The APK boots from package assets, so a remote
// stylesheet or image is a blank screen, not a slow load.
const banned = [
  /cdn\.tailwindcss\.com/,
  /cdnjs\.cloudflare\.com/,
  /fonts\.googleapis\.com/,
  /images\.unsplash\.com/,
  /placehold\.co/,
]

const webDir = join(root, 'web')
for (const name of readdirSync(webDir).filter((entry) => entry.endsWith('.html'))) {
  const source = readFileSync(join(webDir, name), 'utf8')
  for (const pattern of banned) {
    if (pattern.test(source)) failures.push(`web/${name} still references ${pattern.source}`)
  }
}

if (failures.length) {
  console.error('Build guard failed:')
  for (const failure of failures) console.error(`  - ${failure}`)
  process.exit(1)
}

console.log('build guard: web/ is the only app entry, no remote assets')
