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

/** Areas in sidebar order. `subdirs` nests one group per child directory,
 * in the stated order, below the area's own root pages. */
const AREAS = [
  { dir: 'start', label: 'Start here' },
  { dir: 'server', label: 'Running a server' },
  {
    dir: 'modding',
    label: 'Modding',
    subdirs: [
      ['mod', 'The mod'],
      ['world', 'The world'],
      ['messaging', 'Messaging'],
      ['presentation', 'Presentation'],
      ['maps', 'Maps'],
    ],
  },
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

/** The hub leads its own group; large flat lists split by kind. */
function arrange(own, dir) {
  const hub = own.find((p) => p.slug === dir)
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
  return items
}

export function sidebar() {
  const all = pages(ROOT)
  const groups = []

  for (const area of AREAS) {
    const own = all.filter((p) => p.slug === area.dir || p.slug.startsWith(`${area.dir}/`))
    if (own.length === 0) continue

    if (!area.subdirs) {
      groups.push({ label: area.label, items: arrange(own, area.dir) })
      continue
    }

    // Root pages lead; each declared child directory nests as its own group.
    const roots = own.filter((p) => !p.slug.slice(area.dir.length + 1).includes('/'))
    const items = arrange(roots, area.dir)
    for (const [sub, subLabel] of area.subdirs) {
      const dir = `${area.dir}/${sub}`
      const inside = own.filter((p) => p.slug === dir || p.slug.startsWith(`${dir}/`))
      if (inside.length === 0) continue
      items.push({ label: subLabel, items: arrange(inside, dir) })
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

/** Every URL the site has ever published, pointing at the FINAL page it lives
 * at now. Entries are permanent: repointed when a target moves, never deleted,
 * and never allowed to chain into another redirect. */
export const redirects = {
  '/getting-started': '/start/install',
  '/troubleshooting': '/modding/troubleshooting',
  '/concepts': '/modding',
  '/concepts/players-identities-entities': '/modding/world/entities',
  '/build/players-identities-entities': '/modding/world/entities',
  '/guides': '/modding',
  '/guides/first-gamemode': '/modding/gamemodes',
  '/guides/gamemodes': '/modding/gamemodes',
  '/guides/maps': '/modding/maps',
  '/guides/mods': '/modding',
  '/manual': '/modding',
  '/manual/addons-and-identity': '/modding/mod/identity',
  '/manual/archetypes': '/modding/mod/archetypes',
  '/manual/broadcast-and-rpc': '/modding/messaging/signals',
  '/manual/components': '/modding/world/components',
  '/manual/contact-events': '/modding/world/contact',
  '/manual/entities-and-control': '/modding/world/entities',
  '/manual/gamemodes': '/modding/gamemodes',
  '/manual/interaction': '/modding/world/interaction',
  '/manual/languages': '/modding/languages',
  '/manual/limits': '/modding/limits',
  '/manual/mod-manifest': '/modding/mod/manifest',
  '/manual/not-yet': '/boundary',
  '/manual/realms-and-lifecycle': '/modding/lifecycle',
  '/manual/signals': '/modding/messaging/signals',
  '/manual/spatial-queries': '/modding/world/spatial',
  '/addons': '/modding/mod',
  '/addons/addons-and-identity': '/modding/mod/identity',
  '/addons/archetypes': '/modding/mod/archetypes',
  '/addons/mod-manifest': '/modding/mod/manifest',
  '/build': '/modding',
  '/build/body-decoration': '/modding/presentation/body-decoration',
  '/build/broadcast-and-rpc': '/modding/messaging/signals',
  '/build/components': '/modding/world/components',
  '/build/contact-events': '/modding/world/contact',
  '/build/entities-and-control': '/modding/world/entities',
  '/build/entity-ownership': '/modding/world/ownership',
  '/build/gamemodes': '/modding/gamemodes',
  '/build/interaction': '/modding/world/interaction',
  '/build/languages': '/modding/languages',
  '/build/limits': '/modding/limits',
  '/build/playing-sound': '/modding/presentation/sound',
  '/build/realms-and-lifecycle': '/modding/lifecycle',
  '/build/signals': '/modding/messaging/signals',
  '/build/spatial-queries': '/modding/world/spatial',
  '/build/troubleshooting': '/modding/troubleshooting',
  '/build/users-and-entities': '/modding/world/entities',
  '/maps': '/modding/maps',
  '/server/enabled-addons': '/server/enabled-mods',
  '/start/first-balloon': '/modding/first-mod',
  '/start/first-gamemode': '/modding/gamemodes',
  '/reference/broadcast': '/reference/signal',
  '/reference/rpc-out': '/reference/request',
  '/reference/gamemode': '/reference/spawn',
  '/reference/profile': '/reference/session',
}
