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
npm run build                  # writes dist/
node scripts/check-links.mjs   # every internal link must resolve
```

## Where things are

```
src/content/docs/
  index.mdx        the landing page
  getting-started  install, run, confirm a session works
  concepts/        the models the engine decides, and you work with
  guides/          task-shaped walkthroughs
  manual/          one subsystem per page
  reference/       every host interface, generated from the contract
public/
  host.wit         the contract a mod compiles against
astro.config.mjs   navigation and site settings
```

## Writing

Pages are Markdown. A page that needs tabs, cards, file trees or numbered steps is
`.mdx` and imports what it uses from `@astrojs/starlight/components`:

```mdx
import { Tabs, TabItem } from '@astrojs/starlight/components';
```

Three conventions worth knowing before you send a change:

- **Links are absolute from the site root** — `/manual/signals/`, never a relative path.
  The link checker rejects anything that resolves to nothing, and it runs in CI.
- **Say what is not built yet.** Pages carrying a `Draft` badge are incomplete on
  purpose; a promise the engine does not keep costs a reader more than a gap does.
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
