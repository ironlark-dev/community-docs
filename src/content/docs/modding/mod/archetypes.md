---
title: "Archetypes: publishing content"
description: "How a mod ships a thing that can exist in the world — a prop, a zone, a pressable pedestal — and what the manifest can say about it."
kind: explanation
area: modding
sidebar:
  label: "Archetypes"
  order: 50
---

An **archetype** is a named recipe for an entity: a scene to instantiate — or a
primitive shape the host builds — plus how it behaves on the wire and under
touch. Mods publish archetypes; `Entity::spawn` instantiates them.

## Declaring one

In `mod.toml`:

```toml
[mod]
version = "0.1.0"

[[declares.archetype]]
id = "balloon"              # the name, within your mod
scene = "balloon.glb"       # a glTF file beside mod.toml
replication = "dynamic"     # static | dynamic | high-frequency
interact = false            # players can press use on it
contact = false             # touches are reported to you
solid = true                # blocks movement (default)
```

Repeat the block per archetype. The full reference for the manifest is
[`mod.toml`](/modding/mod/manifest/).

Inside your own mod you spawn an archetype by its bare id — a mod never writes
its own identity. Written in full, for another mod to spawn, that same
archetype is `author:mod/archetype/<id>`: for a mod at
`workshop/tutorial/mymode`, the zone below is
`tutorial:mymode/archetype/zone`.

## `replication` — how much wire it deserves

| Value | Sent | Use for |
|---|---|---|
| `static` | once, at spawn | scenery, checkpoints, zones that never move |
| `dynamic` | when its transform changes | doors, platforms, anything you move sometimes |
| `high-frequency` | every send | things in constant motion |

This is per archetype and it is data, so choosing wrong costs bandwidth rather
than correctness. Prefer `static` until something visibly fails to move on
other peers.

Instances replicate **by name**: peers receive the archetype id and
instantiate it from their own copy of the content, so geometry never travels
over the network. That is also why every peer must have the mod — see
[Choosing mods](/server/enabled-mods/) and the join refusal in
[Diagnose a failed join](/server/diagnose-a-failed-join/).

## `interact` and `contact` — asking for events

Both default to false, and both cost a collider per instance, so ask only for
what you use.

- `interact = true` — a player pressing **use** while looking at it calls your
  `on_interact`. See [Interaction](/modding/world/interaction/).
- `contact = true` — physical touches call your `on_contact`. See
  [Contact](/modding/world/contact/).
- `solid = false` — with `contact`, makes a pass-through trigger volume rather
  than an obstacle.

Either event reaches you whether or not you named the instance. What the
event's target carries is up to `set_id`: the id you gave the instance, or the
empty string if you never gave it one. Name an instance when you need to tell
it from its siblings — the bundled `freeroam` stamps every body it spawns.

## Scenes

`scene` is a glTF/`.glb` beside `mod.toml`, authored however you like (Blender
exports these directly). Its named nodes become addressable **parts**:
`entity.part("cap")` resolves the node called `cap`, and the handle it returns
reads and writes like any other.

Two authoring rules worth knowing before you export:

- **Give your meshes normals.** A mesh without them is de-indexed during
  import, and the collider generator then rejects it.
- **The named node you want to address should be the scene root.** Unnamed
  wrapper nodes are given generated names on import, which makes them opaque
  to part paths.

## Shapes

An archetype that is a box, a sphere, a capsule or a cylinder needs no model
file:

```toml
[[declares.archetype]]
id = "zone"
shape = { kind = "box", size = [4.0, 3.0, 4.0] }
visible = false
replication = "static"
contact = true
solid = false
```

The host builds the mesh and the collider from the same numbers, so the visual
and the collision cannot disagree. Dimensions are full extents in meters; the
exact spellings per kind are in [`mod.toml`](/modding/mod/manifest/).

Shapes are how you make a real **volume**. The collider is solid, not a shell:
a player standing fully inside a shape zone keeps one open touch —
`on_contact` fires `started` once on entry and `ended` once on true exit,
however long they stay. A zone written `solid = false` is also transparent to
use-presses and raycasts, so an invisible trigger enclosing a button does not
swallow the press. `solid` defaults to `true`, and a solid zone occludes the
ray whether or not it declares `interact` — that is the one to watch.

Three things a scene has that a shape does not:

- **Parts.** A shape has no named children; `part` resolves only the empty
  path — the root. Every part-addressing example on this site assumes a scene.
- **Authored materials.** A shape has one flat colour:
  `material = { color = "#26bfe6" }`, hex only, alpha optional. Leave it out
  for neutral grey.
- **A silhouette when hidden.** `visible = false` renders nothing while the
  collision stays; with the default `solid = true` that is an invisible wall,
  so pass-through zones almost always want `solid = false` too.

## The registry

At session start, the host indexes the archetypes of *enabled* mods only and
loads their scenes. So a disabled mod's geometry never reaches the asset
loader, and an archetype you publish is spawnable by name for the rest of the
session — including on peers, which build the same index from the same
content.

An archetype name that a peer cannot resolve is dropped with a warning rather
than crashing the session, which is why a content mismatch shows up as things
missing on one screen.
