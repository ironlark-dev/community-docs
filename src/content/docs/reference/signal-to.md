---
kind: reference
area: reference
title: "signal-to"
description: "The narrowed raise: the same announcement delivered to one participant's machine instead of every one of them."
sidebar:
  order: 80
---

Part of the host contract in [`host.wit`](/host.wit). The narrowed form of
[signal](/reference/signal/): the same announcement, delivered to one
participant's machine instead of every one of them. It is its own interface so
the client world simply does not import it — a client half signals its own
machine, and the combination stays unoccupied rather than refused at run time.

Imported by the server world (`server-mod`) only.

## `signal-to`

```wit
signal-to: func(player: session-id, signal: signal-id, payload: list<u8>) -> result<_, error>;
```

Raises `payload` under the resolved name, delivered to the machine of the
participant `player` names, arriving in that machine's
[client-api.on-signal](/reference/client-api/#on-signal). Synchronous and
capped exactly as `signal.signal`, refusing the same things it refuses. One
refusal is its own: a name whose declaration keeps it on a bus cannot be
narrowed — only a signal declared to cross to the clients can be sent to one
of them. A refusal is the [error record](/reference/types/#error).

The session id comes from the [player](/reference/player/) resource or from
[session.participants](/reference/session/#participants).

## Related

- [signal](/reference/signal/) — the broad raise and the caps
- [Signals](/modding/messaging/signals/) — when to narrow, when to broadcast
