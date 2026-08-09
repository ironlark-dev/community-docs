// Every function the host exposes must be documented, and the reference page for an
// interface must exist. A verb that ships undocumented is invisible to everyone
// outside the engine repository, and nothing else notices it.
//
// This reads only the published contract in `public/host.wit`, so it runs anywhere
// the docs run — it needs no access to the engine. Keeping that copy current is a
// separate check, and it belongs where both repositories are checked out.
import { readFileSync, existsSync } from 'node:fs'

const CONTRACT = 'public/host.wit'
const PAGES = 'src/content/docs/reference'

const wit = readFileSync(CONTRACT, 'utf8')

/** Interfaces, each with the functions it declares. */
const interfaces = new Map()
for (const [, name, body] of wit.matchAll(/^interface ([\w-]+) \{\n([\s\S]*?)^\}/gm)) {
  const functions = [...body.matchAll(/^\s{2}([\w-]+):\s*(?:async\s+)?func\b/gm)].map((m) => m[1])
  interfaces.set(name, functions)
}

if (interfaces.size === 0) {
  console.error(`no interfaces found in ${CONTRACT} — the parser and the contract disagree`)
  process.exit(1)
}

let failed = false
let covered = 0

for (const [name, functions] of interfaces) {
  const page = `${PAGES}/${name}.md`
  if (!existsSync(page)) {
    console.error(`missing: ${page} — interface \`${name}\` has no reference page`)
    failed = true
    continue
  }
  const text = readFileSync(page, 'utf8')
  const undocumented = functions.filter((fn) => !new RegExp(`\\b${fn}\\b`).test(text))
  if (undocumented.length > 0) {
    console.error(`${page}: interface \`${name}\` has functions this page never names:`)
    for (const fn of undocumented) console.error(`  ${fn}`)
    failed = true
  }
  covered += functions.length - undocumented.length
}

if (failed) {
  console.error('\nAdd the function to its reference page, or remove it from the contract.')
  process.exit(1)
}

const total = [...interfaces.values()].reduce((n, fns) => n + fns.length, 0)
console.log(`host interface: ${covered}/${total} functions documented across ${interfaces.size} pages`)
