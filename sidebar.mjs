// The sidebar is derived from the pages themselves, not written by hand.
//
// A page's URL carries its area, and its frontmatter carries the job it does
// (`kind`). Grouping here rather than by directory is what lets a page be
// reclassified — an explanation that grows steps becomes a how-to — without its
// URL moving. Generating at config time rather than per request keeps the sidebar
// and the previous/next links derived from one array, so they cannot disagree.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = 'src/content/docs'

/** Areas in sidebar order, with the label each gets as a group. */
const AREAS = [
  { dir: 'start', label: 'Start here' },
  { dir: 'server', label: 'Running a server' },
  { dir: 'build', label: 'Making things' },
  { dir: 'addons', label: 'Addons' },
  { dir: 'maps', label: 'Maps' },
]

/** Kinds in reading order, with the sub-group label each gets. */
const KINDS = [
  ['tutorial', 'Tutorials'],
  ['how-to', 'How to'],
  ['explanation', 'How it works'],
  ['reference', 'Reference'],
]

/** An area splits into per-kind groups only once a flat list stops being scannable. */
const SUBGROUP_ABOVE = 6

/** Enough of a YAML reader for the frontmatter these pages actually carry. */
function frontmatter(text) {
  const block = text.match(/^---\n([\s\S]*?)\n---/)
  if (!block) return {}
  const out = {}
  let inSidebar = false
  for (const line of block[1].split('\n')) {
    const nested = line.match(/^ {2}(\w+):\s*(.+)$/)
    if (inSidebar && nested) {
      out[`sidebar.${nested[1]}`] = nested[2].replace(/^["']|["']$/g, '')
      continue
    }
    const top = line.match(/^(\w[\w-]*):\s*(.*)$/)
    if (!top) continue
    inSidebar = top[1] === 'sidebar'
    if (!inSidebar) out[top[1]] = top[2].replace(/^["']|["']$/g, '')
  }
  return out
}

function pages(dir) {
  const found = []
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) {
      found.push(...pages(path))
    } else if (name.endsWith('.md') || name.endsWith('.mdx')) {
      const slug = relative(ROOT, path).replace(/\.mdx?$/, '').replace(/\/?index$/, '')
      found.push({ slug, ...frontmatter(readFileSync(path, 'utf8')) })
    }
  }
  return found
}

const byOrderThenLabel = (a, b) => {
  const order = (p) => Number(p['sidebar.order'] ?? 1000)
  return order(a) - order(b) || label(a).localeCompare(label(b))
}
const label = (p) => p['sidebar.label'] ?? p.title ?? p.slug
const link = (p) => ({
  label: label(p),
  slug: p.slug,
  // Only the exception is marked. Most pages describe what works today and carry
  // nothing, which is what leaves a badge meaning something when one appears.
  ...(p.state ? { badge: { text: p.state, variant: 'caution' } } : {}),
})

export function sidebar() {
  const all = pages(ROOT)
  const groups = []

  for (const area of AREAS) {
    const own = all.filter((p) => p.slug === area.dir || p.slug.startsWith(`${area.dir}/`))
    if (own.length === 0) continue

    // The hub leads its own group and is never sorted in with the pages under it.
    const hub = own.find((p) => p.slug === area.dir)
    const rest = own.filter((p) => p !== hub).sort(byOrderThenLabel)
    const items = hub ? [link(hub)] : []

    if (rest.length > SUBGROUP_ABOVE) {
      for (const [kind, kindLabel] of KINDS) {
        const of = rest.filter((p) => p.kind === kind)
        if (of.length > 0) items.push({ label: kindLabel, items: of.map(link) })
      }
      const unclassified = rest.filter((p) => !KINDS.some(([k]) => k === p.kind))
      items.push(...unclassified.map(link))
    } else {
      items.push(...rest.map(link))
    }

    groups.push({ label: area.label, items })
  }

  const reference = all.filter((p) => p.slug.startsWith('reference')).sort(byOrderThenLabel)
  groups.push({
    label: 'Interface reference',
    collapsed: true,
    items: [
      ...reference.filter((p) => p.slug === 'reference').map(link),
      ...reference.filter((p) => p.slug !== 'reference').map(link),
    ],
  })

  groups.push({
    label: 'The project',
    items: [
      { label: 'Glossary', slug: 'glossary' },
      { label: 'The boundary today', slug: 'boundary' },
      { label: 'Roadmap', slug: 'roadmap' },
    ],
  })

  return groups
}

/** Every URL the site has ever published, pointing at where that page lives now. */
export const redirects = {
  '/getting-started': '/start/install',
  '/troubleshooting': '/build/troubleshooting',
  '/concepts': '/build',
  '/concepts/players-identities-entities': '/build/users-and-entities',
  '/build/players-identities-entities': '/build/users-and-entities',
  '/guides': '/build',
  '/guides/first-gamemode': '/start/first-gamemode',
  '/guides/gamemodes': '/build/gamemodes',
  '/guides/maps': '/maps',
  '/guides/mods': '/build',
  '/manual': '/build',
  '/manual/addons-and-identity': '/addons/addons-and-identity',
  '/manual/archetypes': '/addons/archetypes',
  '/manual/broadcast-and-rpc': '/build/broadcast-and-rpc',
  '/manual/components': '/build/components',
  '/manual/contact-events': '/build/contact-events',
  '/manual/entities-and-control': '/build/entities-and-control',
  '/manual/gamemodes': '/build/gamemodes',
  '/manual/interaction': '/build/interaction',
  '/manual/languages': '/build/languages',
  '/manual/limits': '/build/limits',
  '/manual/mod-manifest': '/addons/mod-manifest',
  '/manual/not-yet': '/boundary',
  '/manual/realms-and-lifecycle': '/build/realms-and-lifecycle',
  '/manual/signals': '/build/signals',
  '/manual/spatial-queries': '/build/spatial-queries',
}
