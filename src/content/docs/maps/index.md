---
kind: how-to
area: maps
title: "Maps"
sidebar:
  order: 10
---

A **map** is a world you author as data — geometry plus a small manifest. Maps
are host-owned content; they run no code.

## Anatomy

```text
workshop/<author>/<addon>/<map>/
  map.toml        # manifest: the glTF file, spawn points, environment
  <map>.glb       # geometry, materials, lights (glTF, from Blender)
```

A map is addressed `author:addon:mod` (for example `ironlark:core:badgrass`) — a map is a
mod that ships a `map.toml`, so it is named like any other.

## The manifest (`map.toml`)

```toml
[map]
version = "1.0.0"
gltf = "arena.glb"
spawns = [                      # fallback spawn points; yaw in degrees
  { position = [0.0, 5.0, 12.0], yaw = 0.0 },
]

[environment]                   # all optional; the host applies defaults
sun_direction = [-0.8, -0.4, 0.0]
shadows = true
```

Lighting, shadows, and other environment settings are **data**, not engine code.

## Collision: the `col_` convention

Visual geometry and collision are separate. A mesh whose name starts with
`col_` (e.g. `col_ground`) becomes a **collision-only** static collider and is
never rendered. Every other mesh is visual-only. Keep collision meshes simple
(primitive planes / box proxies) — dense collision geometry is the main thing
that slows map loading.

## Spawn points

`map.toml` lists fallback spawns so a map is walkable on its own. The active
**gamemode** can override placement (per-team, per-round, and so on).
