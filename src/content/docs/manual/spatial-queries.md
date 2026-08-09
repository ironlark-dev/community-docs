---
title: "Spatial queries"
description: "Asking the world what is where — a ray, or a sphere. Read-only, and with one exclusion that shapes what you can build."
sidebar:
  order: 38
---

Contact events tell you when something touched you. Spatial queries let you ask on your own
initiative.

```rust
let hit = spatial::raycast(origin, direction, max_distance).await;   // closest hit, or none
let near = spatial::overlap(center, radius).await;                   // your entities in a sphere
```

Both are read-only: they resolve against the physical world without touching the simulation,
so they are cheap enough to use from `update`.

## What a ray can see

- **map geometry** — the world's own colliders
- **collision proxies of archetypes flagged `interact` or `contact`**

and nothing else. In particular:

:::caution[Rays do not see player bodies]
Character bodies are excluded from every cast, deliberately. You cannot hit a player with a
ray, which is why there are no hitscan weapons ([more](../not-yet/)).

What you *can* do is cast a ray **toward** a player's position — read their body's
`transform` — and see whether map geometry blocks it. That gives you line of sight, vision
cones and hide-and-seek, which is most of what a ray is wanted for.
:::

## Hits report geometry; handles stay yours

```rust
if let Some(hit) = spatial::raycast(eye, forward, 50.0).await {
    // hit.position, hit.normal, hit.distance always
    if let Some(entity) = hit.entity {
        // ...only when it was one of YOUR identified entities
    }
}
```

A hit on another mod's entity reports the position, normal and distance but **no handle**. It
occludes; that is all you learn. Same rule as `find`: a handle is permission to mutate, so
handles never cross mods.

`overlap` follows the same scoping — it returns your own identified entities inside the
sphere, capped at 1024 results like `find`.

## Line of sight, concretely

```rust
async fn can_see(eye: Vec3, target: Vec3) -> bool {
    let to = Vec3 { x: target.x - eye.x, y: target.y - eye.y, z: target.z - eye.z };
    let dist = (to.x * to.x + to.y * to.y + to.z * to.z).sqrt();
    match spatial::raycast(eye, to, dist).await {
        // something solid is between us
        Some(hit) => hit.distance >= dist - 0.1,
        // clear line
        None => true,
    }
}
```

The `watchman` reference mod is built on exactly this, and it also shows the trap: a thin ray
can thread a gap and land on a roof, reporting a "clear" line to somewhere the player is not.
Sanity-check what you hit — compare heights, cast more than one ray — rather than trusting a
single result.

## Timing

Colliders do not exist until the map has finished loading, so a query during `init` finds
nothing. Cast from `update` and retry; a first successful ground probe is itself a decent
signal that the world is ready.
