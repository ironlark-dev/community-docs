---
title: "Entities, bodies and control"
linkTitle: "Entities and control"
weight: 20
description: >
  Everything in the world is an entity. A body is not a type — it is an entity a
  player happens to be driving.
---

## A body is a role, not a type

There is no "player object". A player's body is an ordinary entity that a controller has
been bound to, so every entity verb takes an entity and works the same on a crate, a balloon
and a person.

Creation and control are **separate steps**, deliberately:

```rust
let body = entity::spawn("core:character", at).await?;
entity::control(&player_id, &body).await?;
```

`core:character` is the built-in character body — the movement controller, collider and
camera rig the engine owns. Anything else you spawn resolves through the content registry as
`<namespace>:<path>/<archetype>`, e.g. `core:balloons/balloon`.

Because the steps are separate, "spawned but nobody driving it" and "a player with no body"
are both ordinary states. A spectator is a player whose identity is present and whose body
is absent — no special engine state, and equally no special engine support (see [what you
cannot build yet](../not-yet/)).

`release` ends control without destroying the entity. `despawn` destroys it and consumes the
handle.

## Handles are ephemeral; ids are not

`spawn` hands back a **handle** — an opaque capability. You cannot fabricate one, and it is
spent when you despawn the entity or when your mod reloads.

To reach an entity again later, name it:

```rust
entity::identify(&e, "balloon/alice").await?;      // once
let found = entity::find("balloon").await?;        // any time after
```

Ids are `/`-delimited so related entities share a prefix: `find("balloon")` returns
everything beneath it, and `find("")` returns all of your mod's identified entities.

**Naming is scoped to your mod.** You can only identify within your own namespace, and `find`
only sees your own entities. That is the deliberate boundary: a handle is permission to
mutate, so handles never cross mods. When two mods must cooperate, they exchange
[signals](../signals/), not handles.

`body-of(player)` resolves the body a player is driving. That is how a mechanic mod acts on
the player a hook handed it — teleport them, recolour them — without routing every effect
through the gamemode.

## Parts

An archetype spawned from a glTF scene is a small hierarchy. `part(entity, "path")` resolves
a named descendant by its authored node name, and returns a handle you can read and write
like any other:

```rust
let cap = entity::part(&button, "cap").await?;
```

Names come from the model, so a path survives a re-export. `""` is the entity itself.

**`part` fails until the scene has loaded.** Scene loading is asynchronous, so a call in
`init` usually finds nothing. Retry from `update`.
