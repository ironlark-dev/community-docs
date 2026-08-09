---
kind: explanation
area: build
title: "Signals: mod to mod"
description: "Server mods talk to each other in bytes over host-routed channels, and never by holding each other's entities."
sidebar:
  label: "Signals"
  order: 60
---

```rust
signal::subscribe("core:buttons/pressed")?;           // usually in init
signal::emit("core:buttons/pressed", payload)?;       // any time after
```

A subscriber receives `server-api::on-signal(channel, source, payload)`. Server realm only.

## What a signal is, and is not

A signal is a **fact that already happened**. There is no consuming it, no vetoing it, no
reply, and no defined order between two different subscribers. If you find yourself wanting
to *decide* something with a signal — approve a press, block a spawn — that is a different
mechanism the engine does not have yet.

There is no replay either: a late subscriber misses history. Subscribe in `init`.

## `source` is trustworthy; the channel name is convention

The host stamps `source` with the emitting mod's id — a mod cannot forge it. So "only obey
the gamemode" is one comparison:

```rust
async fn on_signal(channel: String, source: String, payload: Vec<u8>) {
    if source != "core:freeroam" { return; }
    ...
}
```

Channel names are pure convention (`addon:name` in the owner's namespace) and are never
enforced, because commands legitimately cross namespaces: a gamemode emitting on another
mod's command channel is the intended shape.

Channels are matched as **exact strings**, so renaming a mod or a channel breaks every
partner silently. There is no compile-time link between two mods.

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
