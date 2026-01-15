import { copyFileSync, mkdirSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const projectRoot = join(__dirname, '..', '..')
const publicDir = join(__dirname, '..', 'public')

// Ensure public directory exists
mkdirSync(publicDir, { recursive: true })
mkdirSync(join(publicDir, 'v2'), { recursive: true })

// Copy dependencies
copyFileSync(
  join(projectRoot, 'app.js'),
  join(publicDir, 'app.js')
)

copyFileSync(
  join(projectRoot, 'v2-src', 'data-adapter.js'),
  join(publicDir, 'v2', 'data-adapter.js')
)

console.log('✓ Copied dependencies to public directory')
