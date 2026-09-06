import { rmSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const targets = [
  'node_modules/.vite',
  'dist',
  'build/output',
  'out',
  'release',
  'electron-dist',
  '.vite',
  '.cache/electron',
]

for (const target of targets) {
  const path = join(process.cwd(), target)
  if (existsSync(path)) rmSync(path, { recursive: true, force: true })
}
