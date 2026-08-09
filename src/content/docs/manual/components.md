---
title: "Components: reading and writing state"
description: "Two generic verbs over a whitelist, rather than a setter per property — and today the whitelist has exactly two rows."
sidebar:
  label: "Components"
  order: 30
---

## The whole write surface

There is no `set-position`, no `set-colour`, no `set-scale`. There is one verb:

```rust
entity::set_component(&e, "transform", &[
    ComponentField { path: "translation".into(), value: FieldValue::Vec3(there) },
]).await?;
```

and its exact inverse, `get-component`, which echoes back each path you ask for so a read
feeds straight into a write.

Capability grows by registering components, never by adding verbs. **Today exactly two are
registered:**

| Component | Paths | Notes |
|---|---|---|
| `transform` | `translation` (vec3), `rotation` (quat), `scale` (vec3) | physics-aware, see below |
| `material` | `base_color` (rgba) | applies to every mesh in the subtree |

Anything else — visibility, health, mass, light colour — is not writable from a mod. If your
design needs one, the change is a row in the host's whitelist, not a new verb.

## `transform` moves physics bodies too

On a physics body, `translation` and `rotation` route to the physics position and rotation
rather than the render transform, so a write genuinely moves the thing rather than fighting
the simulation for a frame. `scale` stays on the transform.

This is what makes teleporting work:

```rust
let body = entity::body_of(&player).await?;
entity::set_component(&body, "transform", &[
    ComponentField { path: "translation".into(), value: FieldValue::Vec3(spawn) },
]).await?;
```

A large enough correction is presented as a cut rather than a smooth slide, because sweeping
a player across the world is the wrong picture for a deliberate move.

## `material` covers a subtree, and does not bleed

Writing `base_color` on an entity recolours **every mesh beneath it**, which is usually what
you want for "make this player red". The archetype's shared material is cloned on the first
write per mesh, so recolouring one instance never tints the others.

## Writes replicate

A whitelisted write on a replicated entity reaches every peer over the same path the value
took locally, and is folded into what a late joiner receives — so someone arriving after the
recolour sees the recoloured thing, not the original.

Root motion is the exception: continuous position and rotation of a replicated root ride the
snapshot stream instead, which is what keeps movement smooth.
