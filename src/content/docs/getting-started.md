---
title: "Getting Started"
sidebar:
  badge:
    text: "Draft"
    variant: "caution"
  order: 20
---

:::caution[Work in progress]
Setup steps will firm up as the launcher and tooling land.
:::

## Prerequisites

- A running Ironlark environment (the game client/host).
- For map authoring: Blender (with glTF export).
- For mod authoring: a toolchain that can build a **WebAssembly component** targeting
  `wasm32-wasip2`. The host loads components, not a particular language — but async exports
  currently narrow the practical choice to Rust, and the reference mods are Rust. Read
  [Choosing a language](/manual/languages/) before you pick one.

## Where your content goes

Content is discovered under `workshop/<namespace>[/<addon>]/`:

```text
workshop/
  core/                 # bundled engine content
    maps/<map>/
    mods/<mod>/
  your-addon/           # your content
    maps/
    mods/
```

Address content as `addon:item` — for example a map `your-addon:arena`, or a mod
`your-addon:doors`.

## Next steps

- Make a world → [Maps](/guides/maps/)
- Add gameplay → [Mods](/guides/mods/)
- Set the session rules → [Gamemodes](/guides/gamemodes/)
