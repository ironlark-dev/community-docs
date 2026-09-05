---
title: "Interaction: pressing things"
description: "The use key, the handler a press reaches, and why the host decides what was pressed rather than trusting the client that pressed it."
kind: explanation
area: modding
sidebar:
  label: "Interaction"
  order: 4
---

Interaction is the aimed press: a player looks at one of your things and presses the use
key, **E**. This page is how that press reaches your server half and what it carries.
For gameplay that fires on touch instead of aim, use
[contact events](/modding/world/contact/) — walking into a zone is often the better
verb.

## Opt in

An archetype is pressable only if its manifest says so:

```toml
[[declares.archetype]]
id = "button"
scene = "button.glb"
replication = "dynamic"
interact = true

[declares.server]
hooks = ["on_tick", "on_interact"]
```

Instances then become pressable, and a press calls your `on_interact` hook. The hook
arrives on the strength of the archetype declaration; the `hooks` list is what admits
the other hooks this half implements ([the manifest](/modding/mod/manifest/)).

## The handler

```rust
use ironlark::server::prelude::*;

// `Context`, `Player`, `Target` and `Vec3` all arrive with the prelude. The
// press reaches this mod because its manifest declares the archetype with
// `interact = true` — whoever spawned the instance.
struct Buttons;

impl ServerMod for Buttons {
    async fn on_interact(
        _ctx: Context,
        player: Player,
        target: Target,
        _hit_point: Vec3,
        distance: f32,
    ) {
        // The id this mod stamped with `set_id`, absent when it never did.
        let Some(id) = target.id else {
            return;
        };
        if id != "button" {
            return;
        }
        log::info!("pressed by {player} from {distance:.2}m");
    }
}
```

The five arguments:

- **`player`** is the presser, lent for this handler. While it runs, that player's body
  is in your reach — teleport them, launch them — under
  [the ownership rule](/modding/world/ownership/).
- **`target`** answers which of your instances was pressed, twice over: `target.entity`
  is a handle lent for this event (act through it now, let it go), and `target.id` is
  your own id for the instance (keep it, and come back later through `Entity::by_id`).
- **`hit_point`** is where the ray struck, in world space — on a multi-part object it
  tells you *which part* was pressed without separate archetypes.
- **`distance`** is from the presser's body to that point, the same measure the reach
  limit enforces.

**`target.id` is an `Option`, and the host never invents an id from the archetype** —
two anonymous instances of one archetype would then share an identity. Absent means this
mod never gave the instance one, and it is ordinary: spawning and `set_id` are two
round-trips, so a press in that gap arrives with no id and every press after it carries
one. A mod that owns exactly one archetype can read an absent id as its own; a mod with
two cannot, and the event carries nothing else to ask — so such a mod gives every
instance it spawns an id ([ids](/modding/world/entities/)).

## The host decides, not the client

The client sends where it was looking; the host casts the ray itself and accepts a hit
only when the hit point lies within **3 metres of the presser's body**. Aim follows the
eye — the ray runs from the camera through the screen centre — but reach is measured
from the body, so a trailing third-person camera buys no extra range, and a claimed
camera origin implausibly far from the body is rejected outright. A client claiming a
hit from across the map is rejected, because the range check is never the client's to
make.

Presses are also rate-limited **before** the raycast: at most one accepted press per
player per 100 ms. Sustained human pressing and deliberate double-taps fit under that;
a modified client emitting presses at wire rate never reaches the expensive half. A
rapid-fire mechanic belongs on [input hooks](/modding/presentation/input/), not on this
path.

That is the general shape to expect from this engine: a client reports intent, the host
resolves consequence.

## Presses follow a moving object

The collision proxy that receives the ray is kept at the visual's position and rotation
every frame, so an interactable your mod moves stays pressable where it appears — a
patrolling pedestal is pressable along its path, not at the spot it started.

Size is the exception: `scale` is not carried onto the proxy, so scaling an interactable
changes what a player sees and not what they can press
([components](/modding/world/components/)). Change the archetype's authored shape
instead.

## Hover feedback

Every peer runs the same reach test locally to show a use-key hint when the player looks
at something pressable — so "can I press this" is answered on the player's own machine,
and the hint never promises a press the host would reject. "Did you press it" stays the
host's alone.

## Your own keys

The use key is the world's one aimed verb, and you do not bind keys from world code.
What you can do is declare **input hooks** of your own in the manifest — named entry
points with default bindings the player may rebind, delivered to your client half. That
is [input](/modding/presentation/input/), and the client half then asks your server half
to act through a [request](/modding/messaging/requests/).
