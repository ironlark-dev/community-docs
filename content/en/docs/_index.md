---
weight: 10
title: Welcome
---

Ironlark is a moddable multiplayer game platform. The engine is a thin **host** that
provides mechanism — maps, physics, networking, a modding runtime — and
**everything else is content you make**: maps, mods, and gamemodes.

This site is the **community guide to building on Ironlark**: everything you need to
build content, and nothing about the engine's own internals.

## What you can build

- **Maps** — worlds authored in Blender (glTF) plus a small manifest. Host-owned
  data; no code required. See [Maps](/docs/guides/maps/).
- **Mods** — WebAssembly components that add gameplay: items, rules, AI, UI.
  See [Mods](/docs/guides/mods/).
- **Gamemodes** — the baseline ruleset of a session (free-roam, deathmatch, …),
  itself just a mod. See [Gamemodes](/docs/guides/gamemodes/).

## How content is organized

Installed content lives under `workshop/<namespace>[/<addon>]/`, where an **addon** is a
distributable bundle containing `maps/` and `mods/`. Everything is addressed as
`addon:item` (for example `core:badgrass`). The bundled engine content is the
`core` addon.

## New here?

Start with [Getting Started](/docs/getting-started/).

{{% alert title="Note" color="info" %}}
Ironlark is in active development; APIs and guides will change. Pages marked
*work in progress* are still settling.
{{% /alert %}}
