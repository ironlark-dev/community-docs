---
title: "The world"
description: "Entities, ownership, components, presses, touches and probes — what a mod's server half does in the shared world, and the one rule that gates it."
kind: explanation
area: modding
sidebar:
  order: 0
---

The world belongs to a mod's server half. One instance of that half runs on the machine
hosting the session; it spawns things, moves them, hears presses and touches, and asks
the world what is where. The client half renders and reads input — it creates nothing
and decides nothing, and everything it shows was told to it over
[messaging](/modding/messaging/). Where your code runs, and when it loads, is
[the lifecycle](/modding/lifecycle/).

Two facts shape everything on these pages:

- **Read is free.** A mod may know anything about the world: cast a
  [ray](/modding/world/spatial/), list [who is connected](/modding/world/entities/),
  hear every [touch](/modding/world/contact/) on its things. Hiding the world from
  mods is not a goal.
- **Write is gated.** Acting on an entity is decided at every write by
  [the ownership rule](/modding/world/ownership/): a mod reaches what it spawned, the
  instances of archetypes it declares, and — briefly — the body of the player whose
  event it is handling. Everything else is refused, aloud.

## The pages

- [Entities, bodies and control](/modding/world/entities/) — everything in the world
  is an entity; a body is one a player happens to be driving.
- [Who may act on an entity](/modding/world/ownership/) — the four admissions, the
  operator's grants, and how to read a refusal.
- [Components](/modding/world/components/) — reading and writing entity state: three
  published rows, typed shortcuts, and the general form.
- [Interaction](/modding/world/interaction/) — the use key, and why the host decides
  what was pressed.
- [Contact events](/modding/world/contact/) — learning that something touched your
  thing, and making zones players walk through.
- [Spatial queries](/modding/world/spatial/) — a ray and a shape probe: asking the
  world on your own initiative.

What a thing in the world IS — its model, its collision shape, whether it is
pressable — is declared next door, in [archetypes](/modding/mod/archetypes/). What a
player sees and hears about it is [presentation](/modding/presentation/overlay/). What
does not exist yet is [the boundary](/boundary/).
