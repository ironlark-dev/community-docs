---
title: "Broadcast and RPC: talking to players"
linkTitle: "Broadcast and RPC"
weight: 50
description: >
  How the authoritative half reaches a player's screen, and how a keypress
  reaches the authoritative half.
---

The server half decides; the client half shows. Neither can do the other's job, so every
piece of feedback a player sees is a message that crossed between them.

## Server to client

```rust
broadcast::send(channel, payload).await;                 // everyone
broadcast::send_to(&player_id, channel, payload).await;  // one player
```

Both deliver to the **client halves** of the same mod on the receiving peers, as
`client-api::on-message(channel, data)`. The payload is bytes: pick your own encoding.

`send-to` is what makes per-player state possible — each player's own score, their own
countdown, "you are it".

The receiving client half renders it:

```rust
async fn on_message(channel: String, data: Vec<u8>) {
    if channel != MY_CHANNEL { return; }
    ui::set_overlay_text(&format!("score: {}", decode(&data)));
}
```

`set-overlay-text` replaces one line of text. That is the entire presentation surface today.

## Client to server

```rust
let reply = rpc_out::call(method, args).await?;   // client half only
```

The host routes the call to whichever loaded server mod claims that method in `handle-rpc`.
A mod that does not own the method returns an error and the host keeps looking, so unrelated
mods coexisting is fine — but two mods claiming one name is a race you should avoid by
namespacing method names.

## The pattern that avoids lying to yourself

`echo`, the one reference mod with both halves, ignores the value its own RPC returns and
renders only what arrives over the broadcast. That is deliberate: if the caller trusted the
return, a completely broken broadcast would still look correct on the screen of the person
pressing the key — and only they would be right.

So: **act on the broadcast, not the reply.** The reply tells you the call succeeded; the
broadcast tells you the world agrees.

## The one available keypress

There is no input system for mods. Exactly one action reaches client halves — `echo`, sent on
**F** — and every client mod sees it and must filter by name. You cannot register an action or
bind a key ([why](../not-yet/)).

For real interaction use trigger volumes and interact presses, which are proper mechanisms
routed to the owning mod.
