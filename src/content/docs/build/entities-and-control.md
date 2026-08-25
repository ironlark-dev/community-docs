---
kind: explanation
area: build
title: "Entities, bodies and control"
description: "Everything in the world is an entity. A body is not a type — it is an entity a player happens to be driving."
sidebar:
  label: "Entities and control"
  order: 20
---

## A body is a role, not a type

There is no "player object". A player's body is an ordinary entity that a controller has
been bound to, so every entity verb takes an entity and works the same on a crate, a balloon
and a person.

Creation and control are **separate steps**, deliberately:

```rust
let body = entity::spawn("character".into(), at).await?;
entity::control(player_id.clone(), &body).await?;
```

`character` is the built-in character body — the movement controller, collider and camera
rig the engine owns. It carries no colon because it is the engine's name, not an addon's.
Your own archetypes are spawned by their bare name; another addon's is written in full,
`ironlark:core:balloons/archetype/balloon`.

**`control` is the gamemode's alone.** Binding a player to a body hands over their camera
and input, so only the mod holding the gamemode role may call it, and no configuration can
delegate that. If you are writing a mechanic rather than a gamemode, you do not need it:
see [who may act on an entity](/build/entity-ownership/).

Because the steps are separate, "spawned but nobody driving it" and "a player with no body"
are both ordinary states. A spectator is a player whose identity is present and whose body
is absent — no special engine state, and equally no special engine support (see [what you
cannot build yet](/boundary/)).

`release` ends control without destroying the entity. `despawn` destroys it and consumes the
handle.

## Handles are ephemeral; ids are not

`spawn` hands back a **handle** — an opaque capability. You cannot fabricate one, and it is
spent when you despawn the entity or when your mod reloads.

To reach an entity again later, name it:

```rust
entity::identify(&e, "balloon/alice".into()).await?;      // once
let found = entity::find("balloon".into()).await?;        // any time after
```

Ids are `/`-delimited so related entities share a prefix: `find("balloon".into())` returns
everything beneath it, and `find("".into())` returns all of your mod's identified entities.

**Naming is scoped to your mod, and it is additive.** You name within your own namespace,
`find` sees only names you gave, and your name for an entity never displaces another mod's.
So an entity can answer to you and to the addon whose archetype it is at the same time,
which is what lets a content addon drive instances another addon placed.

`body-of(player)` resolves the body a player is driving. That is how a mechanic mod acts on
the player a handler was called about — teleport them, launch them — without routing every
effect through the gamemode. It works **inside that handler**, for that player: see
[who may act on an entity](/build/entity-ownership/).

A handle is not permission. Holding one lets you name an entity in a call; whether the call
is allowed is decided from the entity itself, every time. That is why passing handles
between mods would buy nothing, and why mods that cooperate exchange
[signals](/build/signals/) instead.

## Parts

An archetype spawned from a glTF scene is a small hierarchy. `part(entity, "path")` resolves
a named descendant by its authored node name, and returns a handle you can read and write
like any other:

```rust
let cap = entity::part(&button, "cap".into()).await?;
```

Names come from the model, so a path survives a re-export. `""` is the entity itself.

**`part` fails until the scene has loaded.** Scene loading is asynchronous, so a call in
`init` usually finds nothing. Retry from `update`.
