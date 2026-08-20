---
kind: explanation
area: build
title: "Who may act on an entity"
description: "An entity answers to the mod that made it. Four things let you through, and the host works out three of them by itself."
sidebar:
  label: "Entity ownership"
  order: 21
---

You can act on an entity that is **yours**. It is yours if you spawned it, if it is an
instance of an **archetype your mod declares**, or if it is the body of the **player whose
event you are handling right now**. A server owner can also grant an addon authority over
other addons' entities, for janitors and moderation tools. Anything else is refused, and
the refusal names you, the owner, and which of those you were missing.

That is the whole rule. The rest of this page is why it is shaped that way, and what it
means for the code you write.

## You own what you spawn

The host records your mod as the owner when you call `spawn`. Nothing you write says so and
nothing you write can change it — it is where the call came from.

Map geometry and the bodies a server places by default are owned by nobody. Unowned means
no addon may touch them at all, whatever else it holds.

## You own the behaviour of your archetypes

An addon that ships an archetype keeps authority over every instance of it, wherever it came
from.

This is what makes the ordinary split work. Suppose `you:props:balloon` declares a balloon
archetype and the behaviour that drives it, and a placement addon spawns a hundred of them
around a map:

```rust
// in the placement addon: another addon's archetype, written in full
let handle = spawn("you:props:balloon/archetype/balloon".into(), at).await?;
```

The instances belong to the placement addon — it may move them and remove them. Their
**behaviour** belongs to `you:props:balloon`: touch and use events go to the addon that
declared the archetype and wrote the handlers, and that addon may read and write the
instances to animate them. Neither author writes the other's name in code, and no server
configuration is involved.

Name what you want to reach again, and `find` returns instances anyone placed:

```rust
// in the archetype's own addon
identify(&handle, "balloon:7").await?;
let mine = find("balloon").await?;   // every balloon of yours in the session
```

:::tip
Spawning another addon's archetype gives you its **content, not its behaviour**. You get
the prop; its author keeps the rules. That is usually exactly what you want.
:::

## A player's body, inside that player's event

A mod may reach a player's body while it is handling an event about that player — the touch
on its own pad, the press on its own button. The host knows the player directed something at
you, so for the length of that handler you may read and move them.

A teleport pad is the whole pattern:

```rust
async fn on_contact(target: String, other: ContactParty, _point: Vec3, edge: ContactEdge) {
    if !matches!(edge, ContactEdge::Started) { return; }
    let ContactParty::Player(player) = other else { return; };

    // Allowed here, because this event is about this player.
    let body = body_of(player).await?;
    set_component(&body, "transform".into(), vec![destination]).await?;
}
```

The same two calls from `update` are refused. Keeping the player's id in a global does not
keep the player:

```
set-component refused: 'you:tools:launch' is not handling an event, so it may not reach a
  player's body. Act on a player inside the handler that gave you that player.
```

:::caution
The check happens at the **write**, not when `body-of` handed you the handle. There is no
point storing one — a handle is a way to name an entity, never a permission you keep.
:::

This is deliberately narrow. A standing read of every player's position is a live feed of
where everyone on the server is, so it is not available: what you get is the player who just
touched you.

An event lets you **affect** a player, not keep them. It does not let you name their body,
destroy it, or take it over.

## Decorating players, by declaring it

One class of body write needs no event: **decoration rows** — today exactly `label`. Declare
the row in your manifest and you may write it on any player's body, whenever, first write
included:

```toml
[declares]
body-rows = ["label"]
```

That is the whole ceremony — enabling your addon is the permission, and the server states
the declaration in its session-start log. Decoration is a statement observers see about a
player, never a channel out of them or a hand on them: pose, reads, possession and despawn
stay exactly as narrow as above, whatever you declare. One row has one holder per session —
if two enabled addons declare the same row, the earlier one in the server's addon list
holds it and the later declaration is refused aloud. See
[Nameplates](/build/body-decoration/) for the worked example.

## Removing is narrower than writing

Only the mod that **spawned** an entity may destroy it. An archetype's author may drive an
instance, but the instance exists because another addon asked for it, and that addon's
bookkeeping is what a despawn invalidates.

The asymmetry is on purpose, and it rests on what is noticeable. A despawn shows up: `find`
comes back empty, which addons already handle by re-finding or re-spawning. A silent write
into another addon's entity corrupts its state with no signal at all.

If you are writing a cleanup or moderation tool that must remove other addons' entities,
that is the server owner's call, not something an addon can assert. See
[granting authority over other addons' entities](/server/grants/).

## Possession belongs to the gamemode

`control` and `release` are the session gamemode's alone, and there is no setting that
delegates them. Binding a player to a body wires their camera and input to it, so an addon
that could call it on a stranger could take over that stranger.

A session with no gamemode installed has nobody who may possess. Bodies still exist there,
because the server places them itself.

## Reading a refusal

Every refusal comes back as an error from the call and is logged by the server, so an addon
that ignores the result cannot hide it. Each one names who asked, who owns the entity, and
the rule that was missing:

```
set-component refused: 'you:tools:paint' may not reach an entity owned by
  'ironlark:core:balloons'. A mod reaches what it spawned, an instance of an archetype it
  declares, or the body of the player whose event it is handling — anything else needs a
  [grants] row naming it.
```

```
despawn refused: 'you:tools:paint' did not spawn this entity, 'you:props:place' did, and no
  [grants] row lets 'you:tools:paint' remove it
```

If you are seeing one you did not expect, the likely causes in order: you are acting outside
the handler that gave you the player; you spawned another addon's archetype and expected its
events; or you are reaching for something the server has not granted you.
