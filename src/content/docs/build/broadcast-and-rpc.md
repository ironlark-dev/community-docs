---
kind: explanation
area: build
title: "Broadcast and RPC: talking to players"
description: "How the authoritative half reaches a player's screen, and how a keypress reaches the authoritative half."
sidebar:
  label: "Broadcast and RPC"
  order: 50
---

The server half decides; the client half shows. Neither can do the other's job, so every
piece of feedback a player sees is a message that crossed between them.

## Server to client

```toml
# mod.toml — a channel is yours only if you declare it
[declares]
channels = ["score"]
```

```rust
broadcast::send("score", payload).await?;                 // everyone
broadcast::send_to(&player_id, "score", payload).await?;  // one player
```

Both deliver to the **client half of the mod that declared the channel**, on the receiving
peers, as `client-api::on-message(channel, data)`. The payload is bytes: pick your own
encoding.

You write the bare name; the host qualifies it with your mod and delivers on that. Two
addons may both declare `score` and neither hears the other. An undeclared name is refused
at the call, which is why both verbs return a result.

`send-to` is what makes per-player state possible — each player's own score, their own
countdown, "you are it".

The receiving client half renders it:

```rust
async fn on_message(channel: String, data: Vec<u8>) {
    if channel != "score" { return; }   // the bare name you declared
    ui::set_overlay_text(&format!("score: {}", decode(&data)));
}
```

The name arrives bare. Routing already established whose channel it is, so your handler
never writes your own addon id — and a fork of your addon works unchanged.

`set-overlay-text` replaces one line of text. That is the entire presentation surface today.

## Client to server

```toml
# mod.toml — a method is yours only if you declare it
[declares]
methods = ["buy"]
```

```rust
let reply = rpc_out::call("buy", args).await?;   // client half only
```

The host routes the call to the mod that **declared** that method, and to no other. Your
server half receives the bare name in `handle-rpc`; a name carrying `:` names another mod's
method. An undeclared name is refused at the call.

Two mods may each declare `buy`: the host qualifies each with its owner, so they are
different methods and neither shadows the other. Before methods were declared, the host
offered a call to every loaded mod until one answered, which made whichever mod sorted first
able to reject everybody else's RPCs.

## The pattern that avoids lying to yourself

`echo`, the one reference mod with both halves, ignores the value its own RPC returns and
renders only what arrives over the broadcast. That is deliberate: if the caller trusted the
return, a completely broken broadcast would still look correct on the screen of the person
pressing the key — and only they would be right.

So: **act on the broadcast, not the reply.** The reply tells you the call succeeded; the
broadcast tells you the world agrees.

## The one available keypress

There is no input system for mods. Exactly one action exists — `echo`, sent on **F**. Declare
it to receive it:

```toml
[declares]
actions = ["echo"]
```

Only mods that declare an action are called with it, and a name the host does not publish
fails at session start rather than becoming a handler that never runs. You still cannot
register an action of your own or bind a key ([why](/boundary/)).

For real interaction use trigger volumes and interact presses, which are proper mechanisms
routed to the owning mod.
