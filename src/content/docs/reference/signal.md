---
kind: reference
area: reference
title: "signal"
description: "The signal bus: raise a declared name to whoever subscribed, and subscribe to hear future raises."
sidebar:
  order: 70
---

Part of the host contract in [`host.wit`](/host.wit). A raise announces
something to whoever subscribed to that name, the raiser included. There is no
addressee — the name's own declaration says which realm's bus it lands on and
whether it crosses to the client realms. One bus per realm on each machine,
and both realms raise here. How signals are declared and designed is
[Signals](/modding/messaging/signals/); the declaration itself lives in the
[protocol schema](/modding/mod/protocol-schema/).

Imported by both worlds: `server-mod` and `client-mod`.

Ownership is not enforced; existence is. Names resolve to ids once, through
[resolve.signal](/reference/resolve/#signal). A refusal is the
[error record](/reference/types/#error).

## `signal`

```wit
signal: func(signal: signal-id, payload: list<u8>) -> result<_, error>;
```

Raises `payload` under the resolved name. Synchronous, because a raise awaits
nothing: success means the host took it, and overload is a typed refusal on
every route rather than a suspended caller. A raise made before the realm's
mods are all up queues until they are.

What arrives at each subscriber is `on-signal` on its exported API
([server](/reference/server-api/#on-signal),
[client](/reference/client-api/#on-signal)), carrying the payload and the
host-stamped source id of the raiser.

Refuses:

- an over-cap payload, with the cap in the message. The cap is fixed by how
  the declaration says the host carries the name: 64 KiB, or 1 KiB for a
  newest-wins signal, which must fit one datagram.
- overload — a full queue, or more than 16 raises by one mod in one tick. The
  refusal is per tick; a refused raiser raises again next tick.
- a forged, stale or undeclared id.

## `subscribe`

```wit
subscribe: func(signal: signal-id) -> result<_, error>;
```

Delivers future raises of the name to this half's `on-signal` export.
Idempotent, no replay — a signal is a moment, and a late subscriber misses
history by design. Subscriptions die with the mod. Refuses a forged, stale or
undeclared id, and a name whose declared audience this realm cannot hear.

## Related

- [signal-to](/reference/signal-to/) — the same raise, narrowed to one participant
- [request](/reference/request/) — the awaited alternative
- [Signals](/modding/messaging/signals/) — designing with the bus
