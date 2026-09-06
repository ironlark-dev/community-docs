import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

import { redirects } from '../sidebar.mjs'

const ROOT = 'src/content/docs'

/** Non-ASCII characters this site deliberately uses. Anything else is a mistake. */
const ALLOWED = new Set([...'×—…→─│└'])

/** Not published: a link to one is a dead end for a reader outside the team. */
const INTERNAL = /\b(adr[-\s/]?\d{2,}|git\.ywa\.red|\/docs\/design\/|internal wiki)\b/i

const problems = []

function walk(dir) {
  const found = []
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) found.push(...walk(path))
    else if (name.endsWith('.md') || name.endsWith('.mdx')) found.push(path)
  }
  return found
}

function at(text, index) {
  const before = text.slice(0, index)
  const line = before.split('\n').length
  return `${line}:${index - before.lastIndexOf('\n')}`
}

function fences(text) {
  const spans = []
  for (const match of text.matchAll(/^```[\s\S]*?^```/gm)) {
    spans.push([match.index, match.index + match[0].length])
  }
  return spans
}

for (const file of walk(ROOT)) {
  const text = readFileSync(file, 'utf8')
  const code = fences(text)
  const inCode = (i) => code.some(([from, to]) => i >= from && i < to)

  for (const match of text.matchAll(/[^\x00-\x7F]/g)) {
    if (ALLOWED.has(match[0]) || inCode(match.index)) continue
    problems.push(
      `${file}:${at(text, match.index)} non-ASCII character ${JSON.stringify(match[0])}` +
        ' — the site is written in English; translate it or use the ASCII equivalent',
    )
  }

  const internal = text.match(INTERNAL)
  if (internal) {
    problems.push(
      `${file}:${at(text, internal.index)} references internal documentation ` +
        `(${JSON.stringify(internal[0])}) — readers of this site cannot open it`,
    )
  }

  for (const [, href] of text.matchAll(/\]\((\/[^)#?]*)\)/g)) {
    const key = href.replace(/\/$/, '')
    if (key in redirects) {
      problems.push(
        `${file} links to ${href}, which only resolves through a redirect — ` +
          `point it at ${redirects[key]}/ instead`,
      )
    }
  }

  if (!/^title:/m.test(text)) problems.push(`${file} has no title`)
}

if (problems.length > 0) {
  for (const problem of problems) console.error(problem)
  console.error(`\n${problems.length} problem(s).`)
  process.exit(1)
}
console.log(`content: ${walk(ROOT).length} pages checked`)
