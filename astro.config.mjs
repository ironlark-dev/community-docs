// @ts-check
import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'

import { redirects, sidebar } from './sidebar.mjs'

export default defineConfig({
  site: 'https://docs.ironlark.net',
  redirects,
  integrations: [
    starlight({
      title: 'Ironlark',
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/ironlark-dev' },
        { icon: 'discord', label: 'Discord', href: 'https://discord.gg/jAQU93uMy4' },
      ],
      description: 'How Ironlark works, and how to run it, build on it and extend it.',
      editLink: {
        baseUrl: 'https://github.com/ironlark-dev/community-docs/edit/master/',
      },
      lastUpdated: true,
      // Carries the pre-alpha notice onto every page from one place. A notice
      // repeated per page is a background colour; pages mark only the exception,
      // through the `state` frontmatter field.
      routeMiddleware: './src/routeData.ts',
      sidebar: sidebar(),
    }),
  ],
})
