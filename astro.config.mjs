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
      logo: {
        light: './src/assets/logo-light.svg',
        dark: './src/assets/logo-dark.svg',
        alt: 'Ironlark',
      },
      favicon: '/mark-on-dark-32.png',
      head: [
        { tag: 'link', attrs: { rel: 'icon', type: 'image/png', sizes: '96x96', href: '/mark-on-dark-96.png' } },
        {
          tag: 'link',
          attrs: {
            rel: 'icon',
            type: 'image/png',
            sizes: '32x32',
            href: '/mark-on-light-32.png',
            media: '(prefers-color-scheme: light)',
          },
        },
        { tag: 'link', attrs: { rel: 'apple-touch-icon', href: '/mark-on-dark-180.png' } },
        { tag: 'link', attrs: { rel: 'manifest', href: '/site.webmanifest' } },
        { tag: 'meta', attrs: { name: 'theme-color', content: '#1b0300' } },
        {
          tag: 'script',
          content: [
            "addEventListener('dragstart', e => { if (e.target.tagName === 'IMG') e.preventDefault() })",
            "addEventListener('click', e => {",
            "  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return",
            "  const a = e.target.closest('a[href]')",
            "  if (!a || a.hasAttribute('download') || a.origin === location.origin) return",
            "  e.preventDefault()",
            "  window.open(a.href, '_blank', 'noopener')",
            "})",
          ].join('\n'),
        },
      ],
      customCss: ['./src/styles/brand.css'],
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/ironlark-dev' },
        { icon: 'discord', label: 'Discord', href: 'https://discord.gg/jAQU93uMy4' },
      ],
      description: 'How Ironlark works, and how to run it, build on it and extend it.',
      editLink: {
        baseUrl: 'https://github.com/ironlark-dev/community-docs/edit/master/',
      },
      lastUpdated: true,
      routeMiddleware: './src/routeData.ts',
      sidebar: sidebar(),
    }),
  ],
})
