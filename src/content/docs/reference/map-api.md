---
title: "map-api"
description: "Host-owned, read-only queries over the loaded map (mapping track). Lets a gamemode compute spawn placement from the map's data instead of taking the host default. Grows into zones / named-entity / surface queries later."
sidebar:
  order: 80
---

:::note[Generated]
From `host.wit`. Edit the WIT, not this page.
:::

## Functions

| Function | Summary |
|---|---|
| [`list-spawns`](#list-spawns) | The loaded map's declared spawn points (position + facing; yaw in RADIANS, so the values feed straight back into entity.spawn). |

### `list-spawns`

```wit
list-spawns: async func() -> list<spawn-transform>;
```

The loaded map's declared spawn points (position + facing; yaw in RADIANS, so
the values feed straight back into entity.spawn). Returns a single
engine-default fallback when the map declares none, so a gamemode always has
at least one usable spawn.

## Types

### `vec3`

```wit
record vec3 {
  x: f32,
  y: f32,
  z: f32,
}
```

### `spawn-transform`

```wit
record spawn-transform {
  position: vec3,
  yaw: f32,
}
```

