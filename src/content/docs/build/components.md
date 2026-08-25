---
kind: explanation
area: build
title: "Components: reading and writing state"
description: "Two generic verbs over a whitelist, rather than a setter per property — and today the whitelist has exactly three rows."
sidebar:
  label: "Components"
  order: 30
---

## The whole write surface

There is no `set-position`, no `set-colour`, no `set-scale`. There is one verb:

```rust
entity::set_component(&e, "transform".into(), vec![
    ComponentField { path: "translation".into(), value: FieldValue::Vec3(there) },
]).await?;
```

and its exact inverse, `get-component`, which echoes back each path you ask for so a read
feeds straight into a write.

Capability grows by registering components, never by adding verbs. **Today exactly three are
registered:**

| Component | Paths | Notes |
|---|---|---|
| `transform` | `translation` (vec3), `rotation` (quat), `scale` (vec3) | physics-aware, see below |
| `material` | `base_color` (rgba) | applies to every mesh in the subtree |
| `label` | `text` (text), `offset` (vec3), `max_distance` (number), `fade` (number), `through_walls` (boolean) | world-anchored text, see below |

Anything else — visibility, health, mass, light colour — is not writable from a mod. If your
design needs one, the change is a row in the host's whitelist, not a new verb. Fields,
defaults and per-row properties are listed on the
[component rows reference](/reference/components/).

## `transform` moves physics bodies too

On a physics body, `translation` and `rotation` route to the physics position and rotation
rather than the render transform, so a write genuinely moves the thing rather than fighting
the simulation for a frame. `scale` stays on the transform, and only there: the collider
that receives a use-ray or a touch follows position and rotation, not size. Scale an
interactable up and it looks bigger while staying pressable over its original volume.

This is what makes teleporting work:

```rust
let body = entity::body_of(player.clone()).await?;
entity::set_component(&body, "transform".into(), vec![
    ComponentField { path: "translation".into(), value: FieldValue::Vec3(spawn) },
]).await?;
```

A large enough correction is presented as a cut rather than a smooth slide, because sweeping
a player across the world is the wrong picture for a deliberate move.

## `material` covers a subtree, and does not bleed

Writing `base_color` on an entity recolours **every mesh beneath it**, which is usually what
you want for "make this player red". The archetype's shared material is cloned on the first
write per mesh, so recolouring one instance never tints the others.

## `label` is text over an entity, and it answers to you

```rust
entity::set_component(&panel, "label".into(), vec![
    ComponentField { path: "text".into(), value: FieldValue::Text("Teleport".into()) },
]).await?;
```

One call puts a line of text over the entity on every peer. There was no label there
before — this row is **attached by its first write**: the host builds the row's defaults
(a readable offset above the entity, a 30 m visibility range), applies your fields over
them, and inserts the result. No declaration, no attach verb.

A label is attributed speech on a shared entity, so the row is **writer-scoped**: while
its value is off the defaults, only your mod may change it. Any mod with write reach may
still reset it to the defaults — clearing a label is not speaking — and the reset frees
the row for the next writer. Writing the defaults back is the release; when your mod is
disabled, the host resets every label it held.

Two different intents, two different writes: to **hide** your label while keeping it
yours, write `max_distance` to `0`; to **give the row up**, write it back to its
defaults. The [rows reference](/reference/components/) states both.

Text is bounded by the value vocabulary — 256 bytes, no control characters, at least one
visible character. A label reaches a player's body inside an event about that player, like
every body write — or standing, once your manifest declares the row under `body-rows`
([decorating players](/build/body-decoration/)).

The engine renders labels; a mod never draws. The local player's own label is not shown
to them.

## Writes replicate

A whitelisted write on a replicated entity reaches every peer over the same path the value
took locally, and is folded into what a late joiner receives — so someone arriving after the
recolour sees the recoloured thing, not the original.

Root motion is the exception: continuous position and rotation of a replicated root ride the
snapshot stream instead, which is what keeps movement smooth.
