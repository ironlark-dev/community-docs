---
kind: reference
area: reference
title: "signal"
description: "The signal bus: observe-only mod-to-mod events over host-routed byte channels. Signals are facts, not decisions — no consume, no override, subscriber order undefined. A channel is declared in mod.toml, and a name no mod declared is refused at both emit and subscribe. Server realm only."
sidebar:
  order: 50
---

:::note[Generated]
From `host.wit`. Edit the WIT, not this page.
:::

A channel is declared in `mod.toml` under `[declares] channels`, and follows the rule
every name-taking import follows: a bare name is one of your own and the host qualifies
it to `<author>:<addon>:<mod>/channel/<name>`, while a name carrying `:` is another
mod's, taken as written. A name no mod declared is refused where it is written — at
`emit` and at `subscribe` alike.

What arrives in `server-api.on-signal` is the **qualified** id, not the bare name you
wrote. Compare against the full form, including for a channel of your own.

## Functions

| Function | Summary |
|---|---|
| [`emit`](#emit) | Fan `payload` out to every subscriber of `channel`, excluding the sender (no self-delivery — kills the trivial feedback loop). |
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

