---
sidebar_position: 2
title: Getting Started
---

# Getting Started

:::warning Work in progress
Setup steps will firm up as the launcher and tooling land.
:::

## Prerequisites

- A running Ironlark environment (the game client/host).
- For map authoring: Blender (with glTF export).
- For mod authoring: a Rust toolchain with the `wasm32-wasip2` target.

## Where your content goes

Content is discovered under `workshop/<addon>/`:

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

- Make a world → [Maps](/guides/maps)
- Add gameplay → [Mods](/guides/mods)
- Set the session rules → [Gamemodes](/guides/gamemodes)
