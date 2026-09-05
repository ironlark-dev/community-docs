---
title: "Who may act on an entity"
description: "An entity answers to the mod that made it. Four admissions let a caller through, the host establishes them itself, and every refusal says what was missing."
kind: explanation
area: modding
sidebar:
  label: "Entity ownership"
  order: 2
---

You can act on an entity that is **yours**. Four things make it yours, checked in this
order at every write:

1. **You spawned it.**
2. **It is an instance of an archetype your mod declares**, whoever spawned it.
3. **It is the body of the player whose event you are handling right now** — and that
   event is fresh: an interaction or a contact confers standing for 16 simulation ticks
   from admission, after which it is still delivered but grants nothing.
4. **It is a possessed body and your manifest declares this exact row under
   `body-rows`** — the decoration path, for that one row and nothing else.

The one way across mods beyond those is the operator's: a `[grants]` row in the server's
configuration naming your mod. Anything else is refused, and the refusal names you, the
owner, and the rule you were missing.

That is the whole rule — the host works out all four admissions itself, from where the
call came from and what it addressed, so there is nothing to request and nothing to
carry. The rest of this page is why it is shaped this way and what it means for the code
you write. Ids everywhere on this page are the two-segment mod id, `author:mod`.

## You own what you spawn

The host records your mod as the owner when you call `Entity::spawn`. Nothing you write
says so and nothing you write can change it — it is where the call came from.

This also covers a gamemode reading and moving the bodies it spawned itself, at any
time, with no event to stand on: spawner authority is what lets `ironlark:freeroam`
publish where everybody stands from its own tick.

Map geometry and the bodies the host's default spawn places are owned by **nobody**.
Unowned means no mod may touch them at all, whatever else it holds — the host's own
content is outside every scope, grants included.

## You own the behaviour of your archetypes

A mod that ships an archetype keeps authority over every instance of it, wherever the
instance came from.

This is what makes the ordinary split work. Suppose `ironlark:balloons` declares the
balloon archetype, and a placement mod spawns a hundred of them around a map:

```rust
use ironlark::server::prelude::*;

// In the placement mod: another mod's archetype, spelled in full — this
// manifest does not list what another mod ships, so there is no item and the
// name travels as a string.
async fn scatter(at: SpawnPoint) {
    if let Err(e) = Entity::spawn("ironlark:balloons/archetype/balloon", at).await {
        log::error!("no balloon here: {e}");
    }
}
```

The instances belong to the placement mod — it may move them and remove them. Their
**behaviour** belongs to `ironlark:balloons`: presses and touches go to the mod that
declared the archetype and wrote the handlers, and that mod may read and write the
instances to animate them. Neither author writes the other's name in code, and no server
configuration is involved.

Spawning another mod's archetype gives you its content, not its behaviour. You get the
prop; its author keeps the rules. That is usually exactly what you want.

One thing this path never reaches: **a player's body**. A body's archetype is the host's
own `character`, declared in no manifest, so declaring archetypes never becomes
authority over players.

## A player's body, inside that player's event

A mod may reach a player's body while it is handling an event *that player caused at
it* — the touch on its own panel, the press on its own button. Only an interaction and a
contact confer that; a join, a leave, a tick and a signal confer nobody. The
[teleport](/modding/world/contact/) mod is the whole pattern:

```rust
use ironlark::server::prelude::*;

// The touch reaches this mod because its manifest declares the panel
// archetype with `contact = true`. `body_of`, `PhysicsObject`, `ContactEdge`,
// `Target` and `Vec3` all arrive with the prelude.
async fn on_contact(
    _ctx: Context,
    _target: Target,
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
    // Allowed here, because this event is about this player.
    let body = match body_of(player).await {
        Ok(body) => body,
        Err(e) => {
            log::warn!("teleport: body failed: {e}");
            return;
        }
    };
    if let Err(e) = body.set_translation(Vec3::new(5.5, 1.0, 2.0)).await {
        log::error!("teleport: move failed: {e}");
    }
}
```

The same two calls from a tick handler are refused. Keeping the player's id in a `State`
cell does not keep the player:

```text
set-component refused: 'acme:launch' is not handling an event, so it may not
reach a player's body. Act on a player inside the handler that gave you that
player.
```

Three edges of this path are worth knowing before they surprise you:

- **The check happens at the write**, not when `body_of` or `Player::body` handed you
  the handle. The handle keeps addressing the body afterwards; the standing does not.
  There is no point storing one — a handle is a way to name an entity, never a
  permission you keep.
- **Standing ages out.** An interaction or a contact admitted more than 16 simulation
  ticks before your handler ran still arrives — your bookkeeping needs it — but it
  carries no standing over the player by then. Counted in ticks, not milliseconds, so a
  listen server and a headless box agree.
- **It is one player, not players.** An event about one participant does not reach
  another's body:

```text
set-component refused: 'acme:tag' is handling an event about 'user:bob', not
about 'user:alice', whose body this is.
```

This narrowness is deliberate. A standing read of every player's position would be a
live positional feed of the whole server, so what you get is the player who just acted
on you. An event lets you **affect** a player — move them, launch them — never keep
them, give their body an id, destroy it, or take it over.

## Decorating players, by declaring it

One class of body write needs no event: **decoration rows** — today exactly `label`.
Declare the row in your manifest and you may write it on any possessed body, whenever,
first write included:

```toml
[declares]
body-rows = ["label"]
```

That is the whole ceremony — enabling your mod is the appointment, and the server's
session-start log is the receipt. The path confers **that row and nothing else**: pose,
reads, ids, possession and despawn stay exactly as narrow as above, whatever you
declare. One body row has one holder per session — the first declarer in the server's
enabled order holds it, and a later declaration is refused aloud, naming both mods.

A refusal on a decoration row teaches the path:

```text
set-component refused: 'acme:titles' is not handling an event, so it may not
reach a player's body. Act on a player inside the handler that gave you that
player. A mod that declares 'label' under body-rows in its manifest may write
that row on any player's body.
```

[Nameplates](/modding/presentation/body-decoration/) is the worked example.

## Reading is narrower than writing

`get_component` is gated exactly like `set_component`, with two differences:

- a grant admits a read only if it names `read` — `write` does not imply it;
- **the decoration path never opens a read.** A mod that may *label* every body may not
  *read* every body, because a standing read of every body is a positional feed of the
  whole server.

That is the one place this surface withholds a fact rather than an act, and it is
deliberate. Everything else a mod wants to know about the world it may know — see
[spatial queries](/modding/world/spatial/), which report even foreign entities and
participants, as identities rather than handles.

## Removing is narrower still

Only the mod that **spawned** an entity may despawn it. An archetype's author may drive
an instance, but the instance exists because another mod asked for it, and that mod's
bookkeeping is what a despawn invalidates:

```text
despawn refused: 'acme:paint' did not spawn this entity, 'acme:props' did, and
no [grants] row lets 'acme:paint' remove it
```

The asymmetry rests on what is noticeable. A despawn shows up — `find` comes back empty,
which mods already handle by re-finding or re-spawning. A silent write into another
mod's entity corrupts its state with no signal at all.

Handling a player's event does not reach here either, and **no grant, however wide,
destroys a player's body**:

```text
despawn refused: 'acme:janitor' may not destroy a player's body. No grant
reaches one.
```

That is checked before any grant is consulted, so no row can be written that reaches
one.

## Grants: the operator crossing

Everything above is structural — the host derives it from the call. The one
configuration on top is the server owner's `[grants]` table: rows naming a mod, the
verbs it gets (`read`, `write`, `remove`), and whose entities they cover. That is how a
janitor or a moderation tool crosses mods, and it is the operator's call, not something
a mod can assert — see [grants on the server pages](/server/grants/).

Two facts about grants an author should know:

- **The gamemode role carries one built in**: `read` and `remove` over every owner, for
  the session — clearing the field between rounds is the session's own business. Never
  `write`, which would silently rewrite other mods' state.
- **A grant writes rows an entity already carries and never attaches one**, and no grant
  reaches a player's body.

## Possession belongs to the gamemode

`control` and `release` are the session gamemode's alone, and there is no setting that
delegates them. Binding a player to a body wires their camera and input to it, so a mod
that could call it on a stranger could take over that stranger.

A session with no gamemode has nobody who may possess. Bodies can still exist there,
because the host places arrivals itself until a gamemode turns that off.

## Reading a refusal

Every refusal comes back as an error from the call and is logged by the host, so a mod
that ignores the result cannot hide it. The general one names who asked, who owns the
entity, and the whole rule:

```text
set-component refused: 'acme:paint' may not reach an entity owned by
'ironlark:balloons'. A mod reaches what it spawned, an instance of an
archetype it declares, or the body of the player whose event it is handling —
anything else needs a [grants] row naming it.
```

If you are seeing one you did not expect, the likely causes in order: you are acting
outside the handler that gave you that player, or the event has aged past its 16 ticks;
you spawned another mod's archetype and expected its events; you are writing a body row
you never declared; or you are reaching for something the server has not granted you.
