---
kind: explanation
area: addons
title: "Archetypes: publishing content"
description: "How a mod ships a thing that can exist in the world — a prop, a zone, a pressable pedestal — and what the manifest can say about it."
sidebar:
  label: "Archetypes"
  order: 32
---

An **archetype** is a named recipe for an entity: a scene to instantiate, plus how it behaves
on the wire and under touch. Mods publish archetypes; `entity.spawn` instantiates them.

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
[`mod.toml`](/addons/mod-manifest/).

The spawn name is your mod's identity plus the archetype id — for a mod at
`workshop/tutorial/mods/mymode`, `id = "zone"` is spawned as `tutorial:mymode/zone`.

## `replication` — how much wire it deserves

| Value | Sent | Use for |
|---|---|---|
| `static` | once, at spawn | scenery, checkpoints, zones that never move |
| `dynamic` | when its transform changes | doors, platforms, anything you move sometimes |
| `high-frequency` | every send | things in constant motion |

This is per archetype and it is data, so choosing wrong costs bandwidth rather than
correctness. Prefer `static` until something visibly fails to move on other peers.

Instances replicate **by name**: peers receive the archetype id and instantiate it from their
own copy of the content, so geometry never travels over the network. That is also why every
peer must have the addon — see [enabled content](/server/enabled-addons/) and the join refusal in
[troubleshooting](/build/troubleshooting/).

## `interact` and `contact` — asking for events

Both default to false, and both cost a collider per instance, so ask only for what you use.

- `interact = true` — a player pressing **use** while looking at it calls your
  `on-interact`. See [Interaction](/build/interaction/).
- `contact = true` — physical touches call your `on-contact`. See
  [Contact events](/build/contact-events/).
- `solid = false` — with `contact`, makes a pass-through trigger volume rather than an
  obstacle.

For either event to reach you, the instance must be `identify`-ed after spawning. An
unidentified instance is invisible to routing.

## Scenes

`scene` is a glTF/`.glb` beside `mod.toml`, authored however you like (Blender exports these
directly). Its named nodes become addressable **parts**: `entity.part(&e, "cap")` resolves the
node called `cap`, and the handle it returns reads and writes like any other.

Two authoring rules worth knowing before you export:

- **Give your meshes normals.** A mesh without them is de-indexed during import, and the
  collider generator then rejects it.
- **The named node you want to address should be the scene root.** Unnamed wrapper nodes are
  given generated names on import, which makes them opaque to part paths.

## The registry

At session start, the host indexes the archetypes of *enabled* mods only and loads their
scenes. So a disabled addon's geometry never reaches the asset loader, and an archetype you
publish is spawnable by name for the rest of the session — including on peers, which build the
same index from the same content.

An archetype name that a peer cannot resolve is dropped with a warning rather than crashing
the session, which is why a content mismatch shows up as things missing on one screen.
