// @ts-check
import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'

// Every section's overview page is hidden from autogeneration and re-added by hand
// as the group's first item. Left to autogenerate it appears as an ordinary page
// named after its own section, and the group itself leads nowhere.
// The overview link carries the section's own name rather than a bare "Overview":
// previous/next navigation shows sidebar labels, and four pages all called
// "Overview" make every section boundary read as "next: Overview".
const section = (label, dir, overview, extra = {}) => ({
  label,
  ...extra,
  items: [
    { label: overview, slug: dir },
    { autogenerate: { directory: dir } },
  ],
})

export default defineConfig({
  site: 'https://docs.ironlark.net',
  integrations: [
    starlight({
      title: 'Ironlark',
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/ironlark-dev' },
        { icon: 'discord', label: 'Discord', href: 'https://discord.gg/jAQU93uMy4' },
      ],
      description: 'How Ironlark works, and how to run, extend and build on it.',
      editLink: {
        baseUrl: 'https://github.com/ironlark-dev/community-docs/edit/master/',
      },
      lastUpdated: true,
      sidebar: [
        { label: 'Start here', items: ['getting-started', 'troubleshooting'] },
        section('Concepts', 'concepts', 'What the engine decides'),
        section('Guides', 'guides', 'Pick a guide'),
        section('Manual', 'manual', 'Where to start'),
        section('Reference', 'reference', 'How to read this', { collapsed: true }),
      ],
    }),
  ],
})
