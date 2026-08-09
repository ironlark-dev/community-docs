---
kind: reference
area: reference
title: "signal"
description: "The signal bus: observe-only mod-to-mod events over host-routed byte channels. Signals are facts, not decisions — no consume, no override, subscriber order undefined; decision chains belong to the composition hook layer (the composition layer). Channel names are convention (`addon:name` in the protocol owner's namespace), never enforced: commands legitimately cross namespaces (a gamemode emits on another mod's command channel). Server realm only."
sidebar:
  order: 50
---

:::note[Generated]
From `host.wit`. Edit the WIT, not this page.
:::

## Functions

| Function | Summary |
|---|---|
| [`emit`](#emit) | Fan `payload` out to every subscriber of `channel`, excluding the emitter (no self-delivery — kills the trivial feedback loop). |
| [`subscribe`](#subscribe) | Deliver future emits on `channel` to this mod's `server-api.on-signal`. |

### `emit`

```wit
emit: func(channel: string, payload: list<u8>) -> result<_, string>;
```

Fan `payload` out to every subscriber of `channel`, excluding the emitter
(no self-delivery — kills the trivial feedback loop). Delivery is reliable
in the normal case and sheds loudly per overloaded subscriber; it never
stalls the simulation. Emits fired while server mods are still loading are
queued and flushed once all of them are up, so an init-time emit cannot
race another mod's init-time subscribe. Errors on an empty or oversized
channel name, an oversized payload, or an overflow of that pre-load queue.

### `subscribe`

```wit
subscribe: func(channel: string) -> result<_, string>;
```

Deliver future emits on `channel` to this mod's `server-api.on-signal`.
Idempotent; no replay — a signal is a moment, a late subscriber misses
history by design. Subscriptions die with the mod. Errors on an empty or
oversized channel name.

