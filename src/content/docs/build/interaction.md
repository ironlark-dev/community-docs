---
kind: explanation
area: build
title: "Interaction: pressing things"
description: "The use key, and why the host decides what was pressed rather than trusting the client that pressed it."
sidebar:
  label: "Interaction"
  order: 36
---

## Opt in

```toml
[[declares.archetype]]
id = "button"
scene = "button.glb"
replication = "dynamic"
interact = true
```

Instances then become pressable, and a press calls your handler:

```rust
async fn on_interact(player_id: String, target: String, hit_point: Vec3, distance: f32) {
    if target != "button/lobby" { return; }
    // ...
}
```

`target` is **your own id** for the instance — so which of your things was pressed is a string
comparison. As with contact events, an instance you never `identify`-ed produces no events.

`hit_point` is where the ray struck, in world space. On a multi-part object that tells you
*which part* was pressed without needing separate archetypes. `distance` is from the presser's
body to that point.

## The host decides, not the client

The client sends where it was looking; the host casts the ray itself, from the player's
**body**, and accepts a hit only within reach — currently 3 metres. A client claiming a hit
from across the map is rejected, because the range check is never the client's to make.

That is the general shape to expect from this engine: a client reports intent, the host
resolves consequence.

## Presses follow a moving object

The collider that receives the ray is kept in step with the visual each frame, so an
interactable that your mod moves stays pressable where it appears — a patrolling pedestal is
pressable along its path, not at the spot it started.

## Hover feedback

The host runs the same reach test locally to show a use hint when a player looks at something
pressable, so "can I press this" is answered on the player's own machine while "did you press
it" stays authoritative.

## What you cannot do

There is no way to bind your own key, name your own action, or receive movement input — the
use key and one debug key are the whole input surface. See
[what you cannot build yet](/boundary/).

For area-based interaction that needs no key at all, use
[trigger volumes](/build/contact-events/) instead: walking into a zone is often the better verb.
