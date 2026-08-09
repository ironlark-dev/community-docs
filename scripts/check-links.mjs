// Every internal link in the built site must resolve to a page or a file.
// Markdown links survive a rename silently; this is what notices.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const dist = 'dist'
const files = []
;(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    statSync(p).isDirectory() ? walk(p) : files.push(p)
  }
})(dist)

const pages = new Set(
  files.filter((f) => f.endsWith('index.html'))
    .map((f) => '/' + relative(dist, f).replace(/index\.html$/, '')),
)
const assets = new Set(files.map((f) => '/' + relative(dist, f)))

const broken = new Map()
for (const file of files.filter((f) => f.endsWith('.html'))) {
  const html = readFileSync(file, 'utf8')
  const main = html.match(/<main[\s\S]*?<\/main>/)?.[0] ?? ''
  for (const [, href] of main.matchAll(/href="(\/[^"#?]*)"/g)) {
    const target = decodeURIComponent(href)
    const asPage = target.endsWith('/') ? target : target + '/'
    if (!pages.has(asPage) && !assets.has(target)) {
      broken.set(target, (broken.get(target) ?? new Set()).add('/' + relative(dist, file)))
    }
  }
}

if (broken.size > 0) {
  for (const [href, from] of broken) console.error(`broken: ${href}  <- ${[...from].join(', ')}`)
  console.error(`\n${broken.size} internal link(s) point at nothing.`)
  process.exit(1)
}
console.log(`internal links: all resolve (${pages.size} pages checked)`)
