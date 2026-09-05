---
title: Decorating player bodies
description: Put a line of text over every player's head from an ordinary mod — declare the label row under body-rows and write it; the row answers to its writer and vanishes with the mod.
kind: how-to
area: modding
sidebar:
  order: 30
---

A nameplate is a label on a player's body, written without waiting for that
player to touch anything of yours. Writes onto player bodies are normally out
of a mod's reach entirely — see [ownership](/modding/world/ownership/) —
and **decoration rows** are the one exception, opted into with a single
manifest line. The shipped `ironlark:nameplates` mod is this whole page in
about ninety lines; every fence below is its real source.

## Declare the row

```toml
# mod.toml
[declares]
body-rows = ["label"]
```

The declaration is the capability and enabling the mod is the appointment:
no grant, no server configuration, and the server states in its session-start
log which mod holds which row. `label` is the only decoration row today;
declaring any other name refuses the manifest, and a refused manifest takes
the whole mod with it.

One row has one holder per session. If two enabled mods declare `label`, the
one earlier in the [enabled order](/server/enabled-mods/) decorates and the
later declaration is dropped, with a log line naming both mods — layering two
writers on one row would be a reset war neither can win.

## Write the row

Three lookups, in order: the player's display name from the
[session](/reference/session/), their body, then the write.

```rust
use ironlark::server::prelude::*;

/// Writes the player's nameplate. False means "not yet" — the name or the
/// body appears a moment after the join — and the caller retries.
async fn write_nameplate(player: SessionId) -> bool {
    let Some(name) = session::name_of(player).await else {
        return false;
    };
    let Ok(body) = body_of(player).await else {
        return false;
    };
    match body.set_label(&name).await {
        Ok(()) => true,
        Err(e) => {
            log::warn!("nameplates: label failed: {e}");
            false
        }
    }
}
```

The "not yet" cases are real: the body spawns a moment after the join event
reaches your mod, so the shipped mod keeps the joiner on a pending list and
retries from `on_tick` until both lookups answer. It then re-asserts every
couple of seconds — see below for why that heals rather than fights.

The first successful write attaches the row with its defaults: anchored 1.2 m
above the body's origin, visible to 30 m with a fade over the last 5 m, and
hidden when a wall blocks the sight line (`set_label_through_walls(true)` is
the opt-out for text that is meant to be found). The text itself obeys the
component value rules: at most 256 bytes, no control characters, at least one
visible character — a breach is refused whole, never truncated.

## The row answers to its writer

While the label holds anything other than its defaults, only the mod that
wrote it may change it. Any mod with write reach may still reset it **to** the
defaults — which also releases the row. That is why the shipped mod
re-asserts on an interval: a reset nameplate heals within seconds, and a
write that restates the value already held is dropped before it touches
anything, so the steady state costs nothing.

`label` is an ordinary [component row](/modding/world/components/) underneath
— `set_label` is a typed shortcut over the same write — so everything about
rows, values and refusals there applies here.

## Nothing outlives its reason

- A player who leaves takes their body, and the label despawns with it.
- `Entity::release` on a body resets the rows claimed on it, because after
  release nothing has the reach to update or clear them.
- Disabling your mod erases every row it held, on every peer.

So there is no cleanup verb to call and nothing to leak: hold the bookkeeping
(who is pending, who is labeled), drop entries on leave, and the world state
takes care of itself. The shipped mod's `on_leave` is exactly two `retain`
calls.

## What decoration can never do

A decoration row is a statement observers see about a player — never a way to
read them, pose them, possess them or despawn them. Whatever you declare,
those stay behind the ownership gate, permanently; possession belongs to the
gamemode alone. The wider permission model an operator sees is on
[grants](/server/grants/).
