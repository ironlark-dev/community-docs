---
title: "Entities, bodies and control"
description: "Everything in the world is an entity. A body is not a type — it is an entity a player happens to be driving, and creation and control are separate steps."
kind: explanation
area: modding
sidebar:
  label: "Entities and control"
  order: 1
---

An entity is a live thing in the world: a prop, a vehicle, a player's body. This page is
how a server half creates one, addresses it again later, and puts a player into one.
Whether a given call is *allowed* is a separate question with its own page:
[who may act on an entity](/modding/world/ownership/).

## A body is a role, not a type

There is no "player object". A player's body is an ordinary entity that a controller has
been bound to, so every entity verb takes an entity and works the same on a crate, a
balloon and a person.

Creation and control are **separate steps**, deliberately:

```rust
use ironlark::server::prelude::*;

// `Entity`, `SpawnPoint`, `Player` and the `map` module all arrive with the
// prelude. `character` is the host's own body archetype: no manifest declares
// it, so there is no minted item and the name travels as a string.
async fn place(player: Player) {
    let points = map::spawn_points().await;
    let Some(at) = points.first().copied() else {
        log::error!("the map answered no points");
        return;
    };
    let body = match Entity::spawn("character", at).await {
        Ok(body) => body,
        Err(e) => {
            log::error!("no body for the arrival: {e}");
            return;
        }
    };
    if let Err(e) = body.control(player.session()).await {
        log::error!("the body is nobody's: {e}");
    }
}
```

`character` carries no colon because it is the engine's name, not any mod's — the
movement controller, collider and camera rig the host owns. Everything a mod ships is
keyed under its two-segment id, so another mod's archetype is spelled in full:
`ironlark:balloons/archetype/balloon`.

Because the steps are separate, "spawned but nobody driving it" and "a player with no
body" are both ordinary states. A spectator is a participant controlling nothing — no
special engine state, and equally no special engine support (see
[the boundary](/boundary/)).

`Entity::control` and `Entity::release` are verbs on the entity, and `control` takes the
participant as a `SessionId`. **Both are the gamemode's alone**: binding a player to a
body hands over their camera and input, so only the mod holding the session's gamemode
role may call them, and no configuration can delegate that. A gamemode that owns
placement also turns the host's default spawn off first — see
[gamemodes and roles](/modding/mod/declarations/).

`release` ends control without destroying the entity. `despawn` destroys it and consumes
the handle — and only the mod that spawned it may call that
([why](/modding/world/ownership/)).

## Spawning: an item or a string

`Entity::spawn` takes the archetype two ways.

**Your own archetype, as the item your manifest mints.** The declaration is a row in
`mod.toml`, and `ironlark::declares!` turns its `id` into a typed item, so a misspelling
is a compile error rather than a refusal in a session:

```toml
[[declares.archetype]]
id = "button"
scene = "button.glb"
interact = true
```

```rust
use ironlark::server::prelude::*;

// `ironlark::declares!("../mod.toml")` reads the row above and mints
// `archetype::Button` from its id.
mod protocol {
    ironlark::declares!("../mod.toml");
}

ironlark::state! {
    // The handle outlives init only if a clone is kept somewhere.
    static BUTTON: Option<Entity> = None;
}

async fn stand_the_button() {
    let at = SpawnPoint {
        position: Vec3::new(2.0, 0.36, 3.0),
        yaw: 0.0,
    };
    let handle = match Entity::spawn(protocol::archetype::Button, at).await {
        Ok(handle) => handle,
        Err(e) => {
            log::error!("buttons: spawn failed: {e}");
            return;
        }
    };
    // An id, so a press can say which instance it was and a later tick can
    // come back to it.
    if let Err(e) = handle.set_id("button").await {
        log::error!("buttons: set-id failed: {e}");
        return;
    }
    BUTTON.set(Some(handle));
}
```

**Any name, as the string it is.** Another mod's archetype is spelled in full —
`ironlark:balloons/archetype/balloon` — because your manifest does not list what another
mod ships, so there is no item to mint. The host's own `character` is a string for the
same reason. Spawning another mod's archetype gives you its **content, not its
behaviour**: presses and touches on the instance still go to the mod that declared it
([details](/modding/world/ownership/)).

`SpawnPoint` is a world-space position in metres and a yaw about the up axis in radians,
and the host applies exactly those two — no ground snap, no collision resolve. A mod
placing things on terrain it did not author probes the ground first with a
[raycast](/modding/world/spatial/). `map::spawn_points()` answers the loaded map's
suggested points in the same type, so a point read from the map feeds straight into a
spawn.

## Handles are ephemeral; ids are not

`spawn` hands back a **handle** — an opaque capability the host issued. You cannot
fabricate one. Cloning yields a co-owner, so a clone kept in a `State` cell stays valid;
when the last copy drops, only your way of addressing the instance goes — the instance
stays in the world.

Two handles are different: the `Player` a hook hands you, and the entity inside a
[`Target`](/modding/world/interaction/), are **lent for that event** and reclaimed when
the handler returns. A stored copy refuses afterwards with a stale-id error rather than
resolving to whoever came next. Keep the ids, not the handle.

To reach an entity again later, give it an id:

```rust
use ironlark::server::prelude::*;

async fn address(door: &Entity) {
    if let Err(e) = door.set_id("door/north").await {
        log::error!("the door is unreachable by id: {e}");
    }
    // Both lookups are synchronous: they answer from an index without
    // waiting on the simulation, so there is no .await.
    let north = Entity::by_id("door/north");
    let family = find("door");
    if let (Ok(Some(_)), Ok(doors)) = (north, family) {
        log::info!("{} doors answer to this mod", doors.len());
    }
}
```

`set_id`, `by_id` and `find` are the whole id surface:

- **`set_id` names within your own namespace, and it is additive.** Your id never
  displaces another mod's id for the same entity, so an entity can answer to you and to
  the mod whose archetype it is at the same time. Setting your id again moves it to the
  new entity; one id addresses one live entity.
- **`by_id` matches exactly one id** and answers an `Option` — `None` means nothing of
  yours holds that id, which includes an instance nobody named.
- **`find` matches a family, not a wildcard.** `find("door")` returns the entity whose
  id is exactly `door` plus everything under it across both separators —
  `door/north`, `door:7` — and not `door-2`. An empty pattern is every id you minted.
  The answer is capped at 1024 entities; past that the host truncates with a warning in
  its own log and the list looks complete.

An id also routes nothing. A press or a touch reaches the mod that **declared** the
archetype either way; the id only makes the event say which instance it was about.
Nothing checks an id's spelling, so keep to the declared-name charset — lowercase ASCII
letters, digits and `-` per segment — or the id cannot be spelled where names are
declared.

A handle is not permission either. Whether a call through it is allowed is decided from
the entity itself, at every use — which is why handles never cross mods, and mods that
cooperate raise [signals](/modding/messaging/signals/) instead.

## Who is driving it

Ironlark keeps **who you are** apart from **what you are driving**, and a `Player` — the
participant handle every player-shaped hook hands you — exposes three ids that answer
different questions:

| Id | What it names | Keep it? |
|---|---|---|
| `player.session()` — `SessionId` | This participation. Minted per arrival, never reused in the session, present for every participant including bots. | For the session: it is the address `body_of` and `signal_to` take. Never a save key. |
| `player.user()` — `Option<UserId>` | The platform account. Absent when no account stands behind the participant. | To recognise an account. Stamped and free to read. |
| `player.profile().await` — `Option<ProfileId>` | The server-local persona — the save key. | Yes — but personas are not built, so today every read answers `None`. |

The platform states who a joining player is; the joining game never does. Names are a
separate, unauthenticated fact: `session::name_of(session_id)` answers a display name
for showing to a human. Names are for showing, ids are for deciding.

**One body at a time is the body's rule, not the participant's.** The contract says it
on `control` itself: an already-possessed body is released first, so no two participants
ever share one body. Nothing checks the other direction — binding a participant who
already controls something else leaves them marked on both, and `body_of` then answers
wrongly or not at all. A gamemode that re-bodies somebody calls `release` on the old
body first.

To reach the body a participant is driving: `player.body().await` from inside a handler
that was handed the `Player`, or `body_of(session_id).await` from anywhere with a kept
id. Both answer an owned handle that keeps addressing the body afterwards — but the
**standing** to act through it ends with the event that conferred it. That rule, with
everything it admits, is [the ownership page](/modding/world/ownership/).

Death is a choice, not a rule: because the layers are separate, a gamemode decides what
ends — the entity (respawn), the control link (ejected from a vehicle), or the
connection (the player left, and clearing up after them is the gamemode's job).

## Parts

An archetype spawned from a glTF scene is a small hierarchy, and a component write
usually belongs to one piece of it. `part` resolves a named descendant by its authored
node path and answers a handle you use like any other:

```rust
use ironlark::server::prelude::*;

async fn recolor_cap(button: &Entity) {
    // The path is the node names the artist authored; unnamed wrapper nodes
    // are transparent, so a re-export does not break it.
    let cap = match button.part("cap").await {
        Ok(cap) => cap,
        Err(e) => {
            // A scene loads asynchronously: absent for the first frames,
            // so log and let the next tick or the next press retry.
            log::warn!("part failed: {e}");
            return;
        }
    };
    if let Err(e) = cap.set_base_color(Rgba { r: 0.1, g: 0.9, b: 0.2, a: 1.0 }).await {
        log::error!("recolor failed: {e}");
    }
}
```

**`part` fails until the scene has loaded**, so a call in `init` right after the spawn
finds nothing — retry from a later tick. And **this surface is subject to change**:
reading a model's node tree is planned to move onto a surface of its own, so code
written against `part` should expect a rewrite when that lands.

The exact signatures live on the [entity reference](/reference/entity/); the writes a
handle permits are on [components](/modding/world/components/).
