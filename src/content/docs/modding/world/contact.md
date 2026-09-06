---
title: "Contact events and trigger volumes"
description: "How a mod learns that something touched one of its things — and how to make a zone players walk through rather than into."
kind: explanation
area: modding
sidebar:
  label: "Contact events"
  order: 5
---

Contact is the mechanism behind pressure plates, checkpoints, finish lines, capture
zones, lava floors and portals. Where [interaction](/modding/world/interaction/) is the
aimed press, contact is the physical touch — no key involved.

## Opt in, per archetype

An archetype only produces touch events if its manifest says so. This is the teleport
panel, the bundled mod this page follows:

```toml
[[declares.archetype]]
id = "panel"
shape = { kind = "box", size = [1.4, 2.4, 0.2] }
material = { color = "#26bfe6" }
replication = "static"
contact = true
solid = false

[declares.server]
hooks = ["on_tick", "on_contact"]
```

`contact = true` gives every instance a collider whose touch edges the host watches.

`solid = false` makes it a **pass-through trigger**: the collider becomes a sensor on a
layer that character movement ignores, so players walk straight through while the
touches still register. That combination — `contact = true, solid = false` — is a zone.

Leave `solid` out (it defaults to true) and you get a thing players bump into that also
reports touches, like a pressure plate you stand on.

## The handler

```rust
use ironlark::server::prelude::*;

// `Context`, `Target`, `PhysicsObject`, `ContactEdge` and `Vec3` all arrive
// with the prelude. The touch reaches this mod because its manifest declares
// the archetype with `contact = true` — whoever spawned the instance.
struct Teleport;

impl ServerMod for Teleport {
    async fn on_contact(
        _ctx: Context,
        target: Target,
        other: PhysicsObject,
        _point: Vec3,
        edge: ContactEdge,
    ) {
        if !matches!(edge, ContactEdge::Started) {
            return;
        }
        let PhysicsObject::Player(player) = other else {
            return;
        };
        let Some(id) = target.id else {
            return;
        };
        log::info!("{player} stepped onto {id}");
    }
}
```

`target` is the same pair a press carries: a handle lent for this event, and your own id
for the instance when you gave it one ([interaction](/modding/world/interaction/) walks
through both fields).

**`other` is who touched it**, and its three cases are the same vocabulary a
[spatial query](/modding/world/spatial/) answers with:

- `PhysicsObject::Player(session_id)` — a participant's body, as the number that
  addresses them. The body itself comes from `body_of`, which is what carries the
  standing to act on it.
- `PhysicsObject::Entity(Option<String>)` — another mod's entity, under the **full id
  its owner knows it by** (`author:mod` plus the owner's local id), because a local id
  alone means nothing outside the mod that minted it. Absent covers both ways a thing
  arrives anonymous — no enabled archetype owns it, or its owner never named that
  instance — so match on whether an id is there rather than on its text.
- `PhysicsObject::MapGeometry` — the map's own geometry. A floor plate resting on the
  ground hears this permanently; the bundled plate mod filters it out first thing.

Which case arrives also decides the event's cause: a body makes the touch a player's
doing; anything else is the physics.

## Edges only, and the host keeps them paired

Only the two boundary crossings reach a mod — the moment a touch starts and the moment
it ends, never a per-frame stream. "While standing in the zone" is the interval between
the two, which you track by counting:

```rust
use ironlark::server::prelude::*;

// What this mod remembers between events: how many touchers stand on it now.
ironlark::state! {
    static INSIDE: u32 = 0;
}

struct Threshold;

impl ServerMod for Threshold {
    async fn on_contact(
        _ctx: Context,
        _target: Target,
        _other: PhysicsObject,
        _point: Vec3,
        edge: ContactEdge,
    ) {
        let now = INSIDE.update(|count| {
            match edge {
                ContactEdge::Started => *count += 1,
                ContactEdge::Ended => *count = count.saturating_sub(1),
            }
            *count
        });
        log::info!("{now} standing in the doorway");
    }
}
```

A count kept this way is safe, because the host guarantees the pairing:

- Edges are deduplicated per instance and per touching object — only the first
  `Started` and the last `Ended` of one pair become events, so an instance whose several
  colliders all meet the same body fires once.
- An instance touching another of its own colliders is not contact and is dropped.
- Under queue pressure the host cancels a **whole queued pair** rather than half of one.
  A flooded mod can miss a touch entirely; it cannot be left holding an unbalanced
  count.

A collider resting on a surface could otherwise flicker between touching and not. The
host keeps a small contact margin so a *standing* toucher stays reported as touching,
which is why "am I still on it" is stable rather than chattering.

## Events follow the archetype, not the spawner

Touches go to the mod that **declared** the archetype — the one that wrote
`contact = true` and this handler — whoever spawned the instance. So an instance you
never named still produces events, and instances another mod places from your archetype
reach you too.

One consequence: `target.id` can be absent on a real event. Spawning and `set_id` are
two round-trips, and the instance reports touches from the first one, so a touch that
begins in the gap arrives with no id — and its `Ended` edge may arrive after the id
lands. A mod counting edges must count the anonymous ones too, or the tally never
balances. The bundled plate mod does exactly that: it rejects only an id that is present
and *wrong*, never an absent one.

## Teleport, end to end

The bundled `ironlark:teleport` mod is the live example of everything above. A gamemode
raises its create-pair [signal](/modding/messaging/signals/); teleport grounds both
spots with [raycasts](/modding/world/spatial/), spawns two panels and gives them ids
(`pair/0/a`, `pair/0/b`). On a `Started` edge whose `other` is a player, it parses the
target id, looks up the twin, and moves the toucher:

```rust
use ironlark::server::prelude::*;

// Inside `on_contact`, after matching the edge, the player and the id: the
// standing to move this player is the touch's own.
async fn send_to_twin(player: SessionId, destination: Vec3) {
    let body = match body_of(player).await {
        Ok(body) => body,
        Err(e) => {
            log::warn!("teleport: body failed: {e}");
            return;
        }
    };
    if let Err(e) = body.set_translation(destination).await {
        log::error!("teleport: move failed: {e}");
    }
}
```

The arrival point sits in front of the twin, outside its contact margin — so arriving
never triggers the way back. Swap the move for a score and the panel is a capture zone;
swap it for a timer and it is a checkpoint.

## What contact will not tell you

**Players touching each other.** Events fire for *your archetypes*, and a player body is
not one — so tag cannot be built on contact. Ask the other way instead:
[`spatial::intersections`](/modding/world/spatial/) reports every participant a placed
shape touches, which is the supported way to answer "who is near whom".
