---
title: Maps
description: A map is a mod filling the map role — geometry plus a strict little manifest beside the mod's own. What map.toml may say, the col_ collision convention, and what spawn points really promise.
kind: how-to
area: modding
sidebar:
  order: 0
---

A **map** is a world you author as data — geometry plus a small manifest. It
runs no code. And it is not a separate kind of content: a map is an ordinary
[mod](/modding/mod/identity/) that fills the map role by shipping a `map.toml`
beside its `mod.toml`. There is no maps directory anywhere, so the role cannot
be forged by placement — any installed mod carrying a `map.toml` is a map, and
it is addressed `author:mod` like everything else.

The proof is `ironlark:badgrass`, the map every session opens on until
another is chosen. Its whole content:

```text
workshop/ironlark/badgrass/
  mod.toml        # the mod's own manifest: version, description
  map.toml        # the map role: geometry, spawn points, environment
  badgrass.glb    # geometry, materials, lights (glTF, from Blender)
```

```toml
# mod.toml — what every mod states about itself.
[mod]
version = "1.0.0"
description = "Default map: open ground with two spawns and a bright sun."
```

```toml
# map.toml — the map role, whole.
[map]
gltf = "badgrass.glb"
spawn_points = [
    { position = [0.0, 5.0, 12.0], yaw = 0.0 },
    { position = [-12.0, 5.0, -8.0], yaw = 90.0 },
]

[environment]
sun_direction = [-0.8, -0.4, 0.0]
sun_illuminance = 10000.0
shadows = true
```

## The manifest, key by key

`[map]` is the map itself:

| Key | Meaning |
|---|---|
| `gltf` | the geometry file beside the manifest — required |
| `spawn_points` | where this map suggests a body may appear; `position` in meters, `yaw` facing in degrees. Optional, and an empty list is legal |

`[environment]` is the lighting, because lighting and shadows are map data,
not engine code. The whole table and every key in it are optional; the host's
defaults fill what is absent:

| Key | Meaning | Absent means |
|---|---|---|
| `sun_direction` | direction the sunlight travels, world space | `[-0.8, -0.4, 0.0]` |
| `sun_illuminance` | how bright the sun is | `10000.0` |
| `shadows` | whether the sun casts them | `true` |

**The manifest is strict.** A key the engine does not read refuses the whole
file — a key nothing reads is a declaration an author believes in and the
engine ignores, which is worse than an error. The two classic strays: a
`version` in `map.toml` (the mod's own `mod.toml` carries the version, and a
map states nothing about itself twice) and `spawns` (the key is
`spawn_points`). A refused `map.toml` makes the map vanish from discovery,
with the reason in the host's log.

## Collision: the `col_` convention

Visual geometry and collision are separate. A glTF node whose name starts
with `col_` (say `col_ground`) becomes a **collision-only** static collider
and is never rendered; every other mesh is visual-only. Keep the collision
meshes simple — planes and box proxies, not the visual mesh copied — because
dense collision geometry is the main thing that slows a map load.

## Spawn points are suggestions

The list makes a map walkable on its own: the host picks one of the declared
points, per body. They are suggestions and nothing more — the session's
[gamemode](/modding/gamemodes/) owns real placement and may ignore the list
entirely (per-team, per-round, anything). A map that declares none still
works: the engine falls back to a point above the origin, high enough that
the body drops onto the ground instead of spawning half-buried.

Mods can read the map's suggestions through the contract — the dry surface is
the [`map` reference](/reference/map-api/).

## Which map a session is on

Without a choice, a session opens on `ironlark:badgrass`. The host selects
another by mod id through its [configuration](/server/configuration/) or the
[command line](/reference/command-line/). Joiners never choose: the host
announces its map and every joining machine loads the same one — a joiner
that does not have that map installed cannot play a world it cannot see, so
its session ends, naming the map that is missing.
