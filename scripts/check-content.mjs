// Source-level checks on the pages themselves, for the classes of defect a link
// checker cannot see: text in the wrong language, links into records that are not
// published, links to a URL that only still works because a redirect catches it,
// and pages that never say what they are.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

import { redirects } from '../sidebar.mjs'

const ROOT = 'src/content/docs'

/** Non-ASCII characters this site deliberately uses. Anything else is a mistake. */
const ALLOWED = new Set([...'×—…→─│└'])

/**
 * Documentation that is not published. The site is public and these are not, so a
 * link to one is a dead end for every reader who is not on the team.
 */
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

/** Line and column of an index into the file, for an error a person can act on. */
function at(text, index) {
  const before = text.slice(0, index)
  const line = before.split('\n').length
  return `${line}:${index - before.lastIndexOf('\n')}`
}

/** Spans of fenced code, where box drawings and foreign identifiers are legitimate. */
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
