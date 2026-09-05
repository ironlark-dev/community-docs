---
title: "Spatial queries"
description: "A ray and a shape probe: asking the world what is where, on your own initiative. Read-only, and nothing here ever refuses."
kind: explanation
area: modding
sidebar:
  order: 6
---

[Contact events](/modding/world/contact/) tell you when something touched you. Spatial
queries go the other way: a probe your server half performs when it wants to know,
without waiting to be touched. There are two, both under `spatial` in the server
prelude:

```rust
use ironlark::server::prelude::*;

async fn probe(origin: Vec3, forward: Vec3) {
    // The closest surface a ray meets, or None.
    let hit = spatial::raycast(origin, forward, 50.0).await;
    // Everything a placed shape touches: participants, entities, the map.
    let caught = spatial::intersections(Shape::Sphere(8.0), origin, Quat::IDENTITY).await;
    log::info!("hit: {}, caught: {}", hit.is_some(), caught.len());
}
```

Both are read-only and resolve against the physical world without touching the
simulation. Each call is one crossing into the host and back, so the cost of a scan is
the number of calls it makes, not the arithmetic around them — a loop asking once per
participant per tick is the shape to avoid.

## Raycast: the closest surface

`spatial::raycast(origin, direction, max_distance)` travels from `origin` along
`direction` (the host normalizes it, so its length is free) for at most `max_distance`
metres and reports the **first** surface, not a list. What a ray can see:

- **map geometry** — the world's own colliders;
- **the collision shapes of archetypes declared `interact` or `contact`**.

Nothing else. An archetype declaring neither carries no collision shape at all, and a
pass-through zone (`solid = false`) that is not also interactable is deliberately
transparent — a trigger volume never swallows a cast aimed through it.

:::caution[Rays do not see player bodies]
Character bodies are excluded from every **cast** — this caution is about `raycast`
alone, and `intersections` below does report participants. A ray never hits a player,
which is why there are no hitscan weapons ([more](/boundary/)). It is also what the
line-of-sight shape stands on: cast *toward* a player's position, and a clear line
reports no hit at all — anything reported between here and there is cover.
:::

The answer is a `RayHit`: `position` (the origin advanced by `distance` along the
direction), `normal`, `distance` — always present — and `entity`, present **only when
the thing hit is an instance your own mod gave an id to**. Another mod's entity blocks
the ray and reports its geometry without becoming addressable; so does the map. A mod
that needs to know *who* it met gets that from a [contact](/modding/world/contact/) or
from `intersections`, whose vocabulary names owners.

## The worked example: watchman's ground probe

The bundled `ironlark:watchman` and `ironlark:teleport` mods place content on ground
they did not author, with the same helper — cast straight down over the spot and read
the height out of the hit:

```rust
use ironlark::server::prelude::*;

/// The map's ground height at (x, z) by downward raycast, or None while the
/// map's colliders do not exist yet.
async fn ground_height(x: f32, z: f32) -> Option<f32> {
    let origin = Vec3::new(x, 50.0, z);
    let down = Vec3::new(0.0, -1.0, 0.0);
    spatial::raycast(origin, down, 100.0)
        .await
        .map(|hit| hit.position.y)
}
```

`None` doubles as the readiness signal: colliders do not exist until the map has
finished loading, so a probe during `init` finds nothing. Both mods queue their
placement and retry it from the tick — the first successful ground probe is itself a
decent sign the world is ready.

Watchman then decides line of sight the same way. It knows where players stand from a
raised [signal](/modding/messaging/signals/), casts from the statue's eye toward each
one, and calls the line blocked when the reported hit is notably shorter than the
distance to the player:

```rust
use ironlark::server::prelude::*;

/// Whether anything stands between the eye and a point. Bodies are not
/// raycastable, so a clear line to a player reports no hit at all; the slack
/// absorbs grazing geometry near the endpoint.
async fn blocked(eye: Vec3, at: Vec3) -> bool {
    let dir = Vec3::new(at.x - eye.x, at.y - eye.y, at.z - eye.z);
    let distance = (dir.x * dir.x + dir.y * dir.y + dir.z * dir.z).sqrt();
    if distance < 1e-3 {
        return false;
    }
    spatial::raycast(eye, dir, distance)
        .await
        .is_some_and(|hit| hit.distance < distance - 0.6)
}
```

Watchman also shows the trap: a thin ray can thread a gap — an archway — and land
"open" on ground the player is not standing on. Sanity-check what you hit: watchman
rejects any placement lane whose ground height differs from the spawn's by more than a
tolerance, rather than trusting a single ray.

## Intersections: everything a shape touches

`spatial::intersections(shape, at, facing)` places a probe in the world and answers
**everything it touches**, as a `Vec<PhysicsObject>` — the same three cases a contact
edge carries:

```rust
use ironlark::server::prelude::*;

// A radiation field: everybody the zone catches this tick.
async fn irradiate(centre: Vec3) {
    let field = Shape::Sphere(8.0);
    for object in spatial::intersections(field, centre, Quat::IDENTITY).await {
        match object {
            PhysicsObject::Player(session) => log::info!("{session} is in the field"),
            // Another author's prop, with an id or without, and the map itself.
            PhysicsObject::Entity(_) | PhysicsObject::MapGeometry => {}
            // The set may grow, so a match on it carries this arm.
            _ => {}
        }
    }
}
```

Unlike a ray, the answer **does report participants** — `Player(session_id)` — and
foreign entities under the full id their owner knows them by. This is the supported way
to answer "who is standing in my zone" and "who is near whom", which contact cannot
(player bodies are not contact archetypes).

Intersecting, not containing: a body the probe catches by an edge is in the answer,
which is what a zone wants. The probe is not in the world — nothing collides with it, it
blocks nobody, and it exists for the length of the call. And the world's own limit
applies: an archetype declaring neither `interact` nor `contact` carries no collision
shape, so no probe can meet it whatever its identity.

**Identity, never a handle.** The answer names things and hands over nothing to act
through. To act on one of your own instances, take the id and resolve it with
`Entity::by_id` — a synchronous map lookup — and whether the write then lands is
[the ownership rule's](/modding/world/ownership/) to decide, at the write. Reading the
world is unrestricted; acting on it is not.

`Shape` is the same four kinds an archetype's manifest declares under `shape`, so one
vocabulary covers what you place and what you ask: `Box(Vec3)` (full extents per axis),
`Sphere(radius)`, `Capsule(radius, length)` (the length is the cylindrical segment
alone), `Cylinder(radius, height)`.

## Nothing refuses, and answers can be short

Neither verb returns a `Result`. A ray that meets nothing, a zero-length or non-finite
direction, and a host that could not answer all arrive as `None`; an empty intersections
list covers "nothing is in there" and "the host could not answer" alike. Only the host's
own log separates them — so check a computed direction before casting along it.

The intersections list is capped at 1024, the same limit `find` uses. Reaching the cap
stops the scan without a word, so a truncated answer and a complete one look identical.
A mod that might touch that many things tracks them itself.

The exact signatures live on the [spatial reference](/reference/spatial/).
