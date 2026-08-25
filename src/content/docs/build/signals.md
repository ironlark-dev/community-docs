---
kind: explanation
area: build
title: "Signals: mod to mod"
description: "Server mods talk to each other in bytes over host-routed channels, and never by holding each other's entities."
sidebar:
  label: "Signals"
  order: 60
---

```toml
# mod.toml — a channel is yours only if you declare it
[declares]
channels = ["pressed"]
```

```rust
signal::emit("pressed", payload)?;                          // your own, bare
signal::subscribe("ironlark:core:buttons/channel/pressed")?; // someone else's, in full
```

A subscriber receives `server-api::on-signal(channel, source, payload)`. Server realm only.

## What a signal is, and is not

A signal is a **fact that already happened**. There is no consuming it, no vetoing it, no
reply, and no defined order between two different subscribers. If you find yourself wanting
to *decide* something with a signal — approve a press, block a spawn — that is a different
mechanism the engine does not have yet.

There is no replay either: a late subscriber misses history. Subscribe in `init`.

## `source` is trustworthy, and so is the channel name

The host stamps `source` with the emitting mod's id — a mod cannot forge it. So "only obey
the gamemode" is one comparison:

```rust
async fn on_signal(channel: String, source: String, payload: Vec<u8>) {
    if source != "ironlark:core:freeroam" { return; }
    ...
}
```

You never write your own id. You say `pressed` and the host makes it
`ironlark:core:buttons/channel/pressed`, so a fork of your addon talks on its own channels
instead of the upstream's.

**Ownership is not enforced, but existence is.** Anyone may emit on a channel you own — a
gamemode commanding another mod's channel is the intended shape. What is refused is a name
nobody declared, and it is refused where the name is written — at `emit` and at `subscribe`
alike, naming the manifest to check. An accepted subscribe on a name nobody emits would
leave you waiting forever with nothing anywhere saying why.

## Put the data in the payload

A signal does not synchronise with anything else the emitter did. "Hear a signal, then read
the world" is an anti-pattern — the world may not have caught up, and the receiver cannot see
the emitter's entities anyway.

Carry everything the handler needs in the payload.

## Why not just share entities?

Because a handle is permission to mutate. `find` is scoped to your own mod and a ray that
hits a foreign entity withholds its handle, so bytes over a channel is the only cross-mod
reach — by design. The receiver decides what to do to its own content.

The `plates` → `freeroam` → `balloons` chain in the reference mods is the worked example:
a pressure plate announces, the gamemode interprets, a content mod reacts, and none of them
can touch another's entities.
