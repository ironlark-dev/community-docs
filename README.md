# Ironlark documentation

The source of [docs.ironlark.net](https://docs.ironlark.net).

Ironlark is a multiplayer game platform: the engine is a thin host that provides
mechanism — maps, physics, networking, a WebAssembly modding runtime — and the gameplay
on top of it is content, not engine code.

These pages explain how it works and how to do things with it. Read them to understand
the design, to run a server, to author a map or a mod, or just to find out what the
project is. Nothing here is the engine's own source, and none of it describes internals
you would only need if you were building the engine itself.

## Run it locally

```bash
npm ci
npm run dev        # http://localhost:4321
```

Node 22 or newer. Nothing else to install.

```bash
npm run build        # writes dist/
npm run check        # every page says what it is, every host function is documented
npm run check:built  # every internal link resolves — reads dist/, so build first
```

## Where things are

```
src/content/docs/
  index.mdx        the landing page
  start/           install it, run a server, build a first map and gamemode
  server/          running a server: configuration, connectivity, grants
  build/           making things — one subsystem or task per page
  addons/          how content is packaged, named and declared
  maps/            authoring a map
  reference/       one page per host interface, checked against the contract
  glossary.md      the words this site uses, and what each one means
  boundary.mdx     what the engine decides, and what content decides
public/
  host.wit         the contract a mod compiles against
sidebar.mjs        navigation and redirects, derived from the pages themselves
astro.config.mjs   site settings
```

## Writing

Pages are Markdown. A page that needs tabs, cards, file trees or numbered steps is
`.mdx` and imports what it uses from `@astrojs/starlight/components`:

```mdx
import { Tabs, TabItem } from '@astrojs/starlight/components';
```

Four conventions worth knowing before you send a change:

- **Frontmatter carries `area` and `kind`.** `area` is what the page is about and it is
  what the URL shows; `kind` is the job it does — `tutorial`, `how-to`, `reference` or
  `explanation` — and it is deliberately not in the URL. The sidebar is built from both,
  so reclassifying a page that has grown into something else is a one-word edit and its
  URL does not move.
- **Links are absolute from the site root** — `/build/signals/`, never a relative path.
  The link checker rejects anything that resolves to nothing, and it runs in CI.
- **Say what is not built yet.** Absent `state` means the page describes what works,
  which is what almost every page does — the site-wide banner already says so, and what
  is missing lives on `/boundary/`. `state: not-built` or `state: changing` marks the
  exception and puts a caution badge beside the page in the sidebar. A promise the engine
  does not keep costs a reader more than a gap does.
- **Explain the reasoning, not just the steps.** A reader who understands why a thing is
  shaped the way it is can work out the parts nobody wrote down.

## Contributing

Issues and pull requests are welcome, including from people who do not use Ironlark and
just found something confusing — that is useful information. A pull request runs the
build and the link check; it does not publish. Publishing happens when a change lands on
`master`.

## Licence

Documentation text is © the Ironlark project. `public/host.wit` is published so anyone
can see the interface a mod is built against, and build one without asking us for a file.
