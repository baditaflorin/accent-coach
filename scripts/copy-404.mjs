import { copyFileSync, existsSync } from 'node:fs'

if (existsSync('docs/index.html')) {
  copyFileSync('docs/index.html', 'docs/404.html')
}
