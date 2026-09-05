---
kind: reference
area: reference
title: "client-api"
description: "Every function a mod's client half exports: init, the client tick, subscribed signals, and input edges."
sidebar:
  order: 190
---

Part of the host contract in [`host.wit`](/host.wit). The export side of the
client world: the four functions a client half implements and the host calls
on each participant's machine. The server half exports
[server-api](/reference/server-api/) instead.

Exported by the client world (`client-mod`).

Every hook but `init` receives a [`context`](/reference/types/#context) first.
More about the event is asked through [event](/reference/event/) — noting that
a client half cannot name the participant at its own machine, so
`cause-of` answers none there.

## `init`

```wit
init: async func();
```

Nothing has happened yet, so there is no context to take. This is where the
client half resolves its names ([resolve](/reference/resolve/)) and subscribes
([signal.subscribe](/reference/signal/#subscribe)).

## `on-tick`

```wit
on-tick: async func(ctx: context, dt: f32);
```

The client-side tick; the tick number is `ctx.raised-at`.

## `on-signal`

```wit
on-signal: async func(ctx: context, signal: signal-id, source: source-id, payload: list<u8>);
```

A raised [signal](/reference/signal/) this half subscribed to: this machine's
own client bus and the raises crossing from the server realm — broad or
[narrowed to this participant](/reference/signal-to/) — arrive through this one
export. The source is host-stamped, unforgeable, and compares as one integer
against [resolve.source](/reference/resolve/#source).

## `on-input`

```wit
enum input-edge { pressed, released }
```

```wit
on-input: async func(ctx: context, hook: hook-id, edge: input-edge);
```

An input edge on a declared hook. `hook` names a declared hook —
engine-invoked or author-defined, one concept either way — minted by the
declarations and arriving with the dispatch, never resolved by name. The
edge's own tick is `ctx.raised-at`: an edge happens on the tick it happens on.
Declaring hooks and binding keys is [Input](/modding/presentation/input/).

## Related

- [server-api](/reference/server-api/) — the other half's exports
- [request](/reference/request/) — asking the server half and awaiting the answer
- [ui](/reference/ui/) and [audio](/reference/audio/) — what a client half can present
