---
title: "Gamemodes and spawn ownership"
linkTitle: "Gamemodes"
weight: 40
description: >
  A gamemode is an ordinary mod the server designates as the session's baseline
  rule layer. The engine has no gamemode concept beyond that one slot.
---

## Declaring the role

A mod says what it *can* be, in `mod.toml`:

```toml
[mod]
version = "0.1.0"

[provides]
roles = ["gamemode"]
```

That is a statement of capability, never of appointment — the server names the holder.
Exactly one mod holds the role per session.

**Candidates that were not chosen are not loaded at all.** Not "loaded but idle": every
gamemode answers `on-player-join` and would spawn the joiner its own body, so a session with
two live gamemodes gives everyone two bodies.

## Designating one

An unset slot resolves to the only candidate — so a fresh install with one gamemode just
works. With **several installed and none named, the session refuses to start** and tells you
which to pick. The engine deliberately has no default: a default spelled into the host would
be the host knowing about a specific piece of gameplay.

{{% alert title="This will bite you immediately" color="warning" %}}
The moment you add your own gamemode alongside the bundled `core:freeroam`, there are two
candidates. Every launch then refuses until you name one:

```
--gamemode ironlark:examples/mygamemode
```

or in `config/server.toml`:

```toml
[session]
gamemode = "ironlark:examples/mygamemode"
```

The refusal is the resolver working correctly. It is not your mod failing to load.
{{% /alert %}}

## Owning spawn

By default the host spawns every joiner itself at a map spawn point, which is what makes a
bare server playable with no gamemode installed. A gamemode that places players turns that
off in `init` and takes over:

```rust
async fn init() {
    gamemode::set_default_spawn(false);
}

async fn on_player_join(player_id: String) {
    let spawns = map_api::list_spawns().await;      // never empty
    let at = pick(&spawns);
    let body = entity::spawn("core:character", at).await?;
    entity::control(&player_id, &body).await?;
}
```

`list-spawns` returns the map's declared points, with a single engine fallback when a map
declares none — so there is always at least one usable placement. Yaw is in radians and feeds
straight back into `spawn`.

Turn it off in `init`, not later: the host holds joins until every server mod has loaded, so
`set-default-spawn(false)` during `init` is guaranteed to land before the first join. Do it
from `on-player-join` and the host has already spawned that player.

You are not obliged to spawn anyone. A joiner with no body is a legitimate state — that is
how "wait for the next round" works. Note the caveat in [what you cannot build
yet](../not-yet/): a player with no body has no camera, so waiting is currently a black
screen rather than a spectator view. Place them somewhere instead.

## Rounds and phases

The engine has no concept of a round, a score or a phase. A gamemode keeps that state itself
and drives it from `update(dt)`, accumulating `dt` rather than counting ticks (ticks are
dropped under load).

To tell players what is happening, the server half broadcasts and the mod's **client half**
renders it — see [broadcast and RPC](../broadcast-and-rpc/). A server-only gamemode cannot
put text on a screen.
