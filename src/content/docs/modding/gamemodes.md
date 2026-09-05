---
title: Gamemodes
description: One mod per session holds the gamemode role. It owns the rules everyone else plays inside, placement first among them.
kind: explanation
area: modding
sidebar:
  order: 20
---

A gamemode is an ordinary mod that a session names to a role. There is one
slot: a session runs at most one gamemode, and the decisions that belong to
the whole session — who gets a body, where, and when — are open to that mod
alone. Everything on this page sits on the ordinary mod machinery: the
[manifest](/modding/mod/manifest/), [signals](/modding/messaging/signals/) and
the [world verbs](/modding/world/entities/).

## Becoming a candidate, and being chosen

The manifest states the capability:

```toml
[declares]
roles = ["gamemode"]

[declares.server]
hooks = ["on_join", "on_leave", "on_tick"]
```

Declaring the role makes the mod a candidate, never the holder. The session
picks the holder, in the server's own configuration
(`[session] gamemode = "you:arena"`, or the `--gamemode` flag). Two rules
close the gaps:

- The setting absent with exactly one candidate installed resolves to that
  candidate.
- The setting absent with several candidates refuses to start the session,
  naming them. There is no engine default to fall back on.

A candidate that lost the pick is not loaded at all, so two gamemodes never
run side by side. The bundled baseline, `ironlark:freeroam`, is one candidate
like any other.

## Owning placement

The host puts every arriving participant into a body of its own accord until
the gamemode takes that job over. The takeover is one awaited call, and
`init` is where it belongs — the host holds its first placement until every
server half has finished `init`, so a change awaited there lands before
anybody is placed:

```rust
use ironlark::server::prelude::*;

struct Arena;

#[ironlark::hooks("../mod.toml")]
impl ServerMod for Arena {
    async fn init() {
        // From here on this mod owes every arrival a body.
        if let Err(e) = gamemode::spawn().disable_auto().await {
            log::error!("arena does not hold the gamemode role: {e}");
        }
    }

    async fn on_join(_ctx: Context, player: Player) {
        let spawns = map::spawn_points().await;
        let Some(at) = spawns.first().copied() else {
            log::error!("the map answered no points");
            return;
        };
        // The host's own body archetype has no manifest behind it, so the
        // name travels as a string.
        let body = match Entity::spawn("character", at).await {
            Ok(body) => body,
            Err(e) => {
                log::error!("no body for the arrival: {e}");
                return;
            }
        };
        if let Err(e) = body.control(player.session()).await {
            log::error!("the body is nobody's: {e}");
        }
    }
}

ironlark::export_server!(Arena);
```

`gamemode::spawn()` opens the session's placement settings;
`disable_auto()` and `enable_auto()` settle the one decision it carries
today, and awaiting applies it. A caller that does not hold the role is
refused, and the message names the holder or says the session installed
none. [`map::spawn_points`](/reference/map-api/) answers the loaded map's
suggested points; handing them out in turn spreads arrivals, and ignoring
them for a computed placement is equally allowed — the shipped
`ironlark:freeroam` round-robins them.

A session in which the host is not placing and the gamemode has dropped out
is ended by the host, because nothing left in it can give anyone a body.

## What else the role carries

- [`Entity::control`](/reference/entity/) and `Entity::release` — binding a
  participant to a body and taking them out of one — are the gamemode's
  alone. A mod able to bind anyone to a body it owns takes that person's
  camera and input, which is not a thing content should do.
- The role carries a read and a remove grant over every owner for the
  session, so a gamemode may clear the field between rounds. The full rule
  is on [ownership](/modding/world/ownership/).
- Everything else is ordinary. A gamemode hears facts and issues commands
  over the same [signals](/modding/messaging/signals/) every mod uses, and
  its manifest declares hooks like any other.

## Where the rules of a round live

In the gamemode's own state and payload types, not in the engine. Scores,
phases, timers and win conditions are mod code: keep them in
[`state!`](/modding/lifecycle/) cells, raise the whole standing of the round
to `CLIENTS` so a late joiner is right after one raise, and let the client
half paint it. The engine holds the slot, the placement switch and the
grants — nothing else.
