---
kind: reference
area: reference
title: "server-api"
description: "Every function a mod's server half exports: init, the lifecycle and traffic hooks, and the declared-but-unfired structural hook set."
sidebar:
  order: 180
---

Part of the host contract in [`host.wit`](/host.wit). This is the export side
of the server world: the twenty functions a server half implements and the
host calls. Eight fire today — `init`, `on-join`, `on-leave`, `on-tick`,
`on-interact`, `on-contact`, `on-request`, `on-signal` — and twelve structural
hooks are declared but unfired, listed at the end. When each hook runs in a
mod's life is [Lifecycle](/modding/lifecycle/).

Exported by the server world (`server-mod`); the client half exports
[client-api](/reference/client-api/) instead.

Every hook but `init` receives a [`context`](/reference/types/#context) first:
the event id, the tick it was raised on, and the tick the handler runs on.
More about the event is asked through [event](/reference/event/).

## `init`

```wit
init: async func();
```

The one export that is not an event: nothing has happened yet, so there is no
context to take. This is where names resolve to ids
([resolve](/reference/resolve/)) and subscriptions are made
([signal.subscribe](/reference/signal/#subscribe)).

## `on-join`

```wit
variant arrival { fresh, migrated(list<u8>) }
```

```wit
on-join: async func(ctx: context, player: borrow<player>, arrival: arrival);
```

A participant joined, lent as the [player](/reference/player/) resource for
this call. A node handoff resumes a mod instead of re-initing it: the
`migrated` case carries an opaque blob a real meshing design fills later — the
case is frozen, the contents are free.

## `on-leave`

```wit
variant leave-reason { quit, kicked, timeout }
```

```wit
on-leave: async func(ctx: context, player: borrow<player>, reason: leave-reason);
```

A participant left, with why. Leaving has no migrated case: a handoff is not a
departure, and the participant is still playing elsewhere.

## `on-tick`

```wit
on-tick: async func(ctx: context, dt: f32);
```

The fixed-rate server tick; the tick number is `ctx.raised-at`. A slow handler
is skipped until it finishes, never stalling the simulation.

## `on-interact`

```wit
record target-ref { entity: option<borrow<entity-handle>>, id: string }
```

The handle reaches the entity without a round-trip; the id keeps prefix
family-scan (`"pair/3/a"` parses). The handle is always present: an instance
that died between raise and dispatch still arrives with one, and its verbs are
what refuse. The id is `""` when this mod never gave the instance one.

```wit
on-interact: async func(ctx: context, player: borrow<player>, target: target-ref, hit-point: vec3, distance: f32);
```

A participant used one of this mod's interactable
[archetypes](/modding/mod/archetypes/). While the handler runs, that
participant's body is in this mod's reach. The model is
[Interaction](/modding/world/interaction/).

## `on-contact`

```wit
enum contact-edge { started, ended }
```

```wit
on-contact: async func(ctx: context, target: target-ref, other: physics-object, point: vec3, edge: contact-edge);
```

Physical touch on one of this mod's contact archetypes, routed to the
declaring mod whoever spawned the instance. Only the edges cross the boundary,
never per-frame contact data. `other` speaks the shared
[physics-object](/reference/types/#physics-object) vocabulary. The model is
[Contact](/modding/world/contact/).

## `on-request`

```wit
on-request: async func(ctx: context, player: borrow<player>, request: request-id, payload: list<u8>) -> result<list<u8>, error>;
```

The answering side of [request](/reference/request/). `request` is one this
mod declared; routing already established whose it is. `player` is the one
whose client half asked, lent for this call. Payload and answer are capped,
and the refusal carries the cap; an error returned here is what the asking
half's `request` call receives.

## `on-signal`

```wit
on-signal: async func(ctx: context, signal: signal-id, source: source-id, payload: list<u8>);
```

A raised [signal](/reference/signal/) this mod subscribed to. The payload
carries everything needed: a signal does not synchronize with the raiser's
queued entity verbs. The source is host-stamped, unforgeable, and compares as
one integer against [resolve.source](/reference/resolve/#source).

## The structural hook set

Twelve more exports are declared in the contract and nothing fires them yet;
each costs one empty function. They exist so the export set does not break
when their mechanism lands — an export added later would be a flag day for
every compiled mod. Their shared return is a verdict — allow, deny, or a
reserved value-carrying case — and their real parameters are that design's
own concern. The twelve:

- `on-body-created`
- `on-body-destroyed`
- `on-entity-spawned`
- `on-entity-despawned`
- `on-component-changed`
- `on-map-loaded`
- `on-map-unloaded`
- `on-session-started`
- `on-session-ended`
- `on-possession-changed`
- `on-profile-swapped` — load-bearing once personas exist: per-profile mod
  state re-keys on a hot-swap
- `body-spawn-requested` — the deferrable gate; the host holds its own
  default spawn

What is planned for them lives on the [roadmap](/roadmap/).

## Related

- [client-api](/reference/client-api/) — the other half's exports
- [Lifecycle](/modding/lifecycle/) — init, ticks, joins in order
- [First mod](/modding/first-mod/) — a working pair of halves
