---
kind: explanation
area: build
title: "Contact events and trigger volumes"
description: "How a mod learns that something touched one of its things — and how to make a zone players walk through rather than into."
sidebar:
  label: "Contact events"
  order: 35
---

Contact is the mechanism behind pressure plates, checkpoints, finish lines, capture zones,
lava floors and portals. It is the most useful thing in the engine for gameplay that happens
*somewhere*.

## Opt in, per archetype

An archetype only produces touch events if its manifest says so:

```toml
[[provides.archetype]]
id = "zone"
scene = "zone.glb"
replication = "static"
contact = true          # I want to hear about touches
solid = false           # ...and players should walk through, not into
```

`contact = true` gives every instance a collider whose touch edges the host watches.

`solid = false` makes it a **pass-through trigger**: the collider becomes a sensor and moves
to a layer that character movement ignores, so players walk straight through while the
touches still register. That combination — `contact = true, solid = false` — is a zone.

Leave `solid` out (it defaults to true) and you get a thing players bump into that also
reports touches, like a pressure plate you stand on.

## The handler

```rust
async fn on_contact(
    target: String,
    other: ContactParty,
    point: Vec3,
    edge: ContactEdge,
) {
    let ContactParty::Player(player_id) = other else { return };
    match edge {
        ContactEdge::Started => { /* they entered */ }
        ContactEdge::Ended   => { /* they left */ }
    }
}
```

`target` is **your own id** for the instance that was touched, so "which zone was it" is a
string comparison, and it feeds straight back into `find`.

`other` is who touched it: a `player` (with their identity id), another `entity` (a contact
archetype, with its owner-scoped id), or `map-geometry`.

Only **edges** cross the boundary — the moment a touch starts and the moment it ends, never a
per-frame stream. "While standing in the zone" is the interval between the two, which you
track yourself.

:::caution[You must identify an instance to hear about it]
Events route to the owning mod through the id you gave the instance. An instance you spawned
but never `identify`-ed produces no events, and the host says so:

```
interactable instance has no id — its mod never identified it
```

So: `spawn`, then `identify`, then you get touches.
:::

## A zone, end to end

```rust
async fn init() {
    let zone = spawn("tutorial:mymode/zone", at).await?;
    identify(&zone, "zone/hill").await?;      // required, or no events
}

async fn on_contact(target: String, other: ContactParty, _p: Vec3, edge: ContactEdge) {
    let ContactParty::Player(player) = other else { return };
    if target != "zone/hill" { return; }
    match edge {
        ContactEdge::Started => OCCUPANTS.lock().unwrap().insert(player),
        ContactEdge::Ended   => OCCUPANTS.lock().unwrap().remove(&player),
    };
}

async fn update(dt: f32) {
    // Score whoever is standing in it, using accumulated dt — never a tick count.
}
```

That is king-of-the-hill. Swap the scoring for a teleport and it is a lava floor; swap it for
a timer and it is a checkpoint.

## What contact will not tell you

**Players touching each other.** Events fire for *your archetypes*, and a player body is not
one — so tag cannot be built on contact. Compare body positions each tick instead: read
`transform`'s `translation` for each player and subtract. That is what the reference gamemode
does to publish positions.

## A note on standing still

A collider resting on a surface can otherwise flicker between touching and not touching. The
host keeps a small contact margin so a *standing* toucher stays reported as touching, which is
why "am I still in the zone" is stable rather than chattering.
