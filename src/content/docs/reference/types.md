---
kind: reference
area: reference
title: "types"
description: "The shared vocabulary of the host contract: the wire error, the id aliases, the event context, the math records, and the field value set."
sidebar:
  order: 20
---

Part of the host contract in [`host.wit`](/host.wit). Every other interface
builds on this vocabulary: the errors its functions refuse with, the ids their
arguments carry, and the value shapes component fields take. Both worlds see
it through the interfaces they import; nothing here is called directly.

## `error`

```wit
record error { code: u32, message: string, data: list<u8> }
```

Every refusal in the contract is this record. It is minimal and growable on
purpose: a WIT variant cannot grow a case without an ABI break, so the rich
taxonomy lives in the SDK and a new error kind is a new `code`, never a
contract change.

The codes the host uses today:

| Code | Meaning |
|---|---|
| `1` | Refused — a well-formed call the host declined on its merits. |
| `2` | Too large — a payload past a published cap; the message carries both numbers. |
| `3` | Unresolved name — a name or id this session does not carry. |
| `4` | Overloaded — the host took nothing: a full queue, a full inbox, a spent budget. |
| `100` | Host failure — a host-side fault the mod did not cause. |

One cap, one sentence: every verb that refuses an oversized payload says the
same message shape with its own two numbers, so a single arm in your code
catches all of them.

## `uuid` and the id aliases

```wit
record uuid { high: u64, low: u64 }
```

A 128-bit value, carried as two halves because the ABI has no wider integer.
Named rather than paired: nothing an author can see hands out a value whose
parts are told apart by position.

| Alias | Of | Lives |
|---|---|---|
| `user-id` | `uuid` | The platform account. Platform-global, minted centrally, never truncated. |
| `profile-id` | `uuid` | Server-owned, server-local persona; the platform neither stores nor links it. Opaque to a mod, the save key. Personas are not built: every read answers none, and the option exists so a mod written now keys correctly when they arrive. |
| `session-id` | `u64` | A participant. Never reused within the session that issued it, present for every participant including bots. Never a save key; nothing about it outlives the session. |
| `instance-token` | `u64` | Generational per entity instance: entity ids are reused, the token is not, so a stale holder can never address this tick's stranger. |
| `event-id` | `uuid` | One raised event, for its whole life across both realms: minted once where it is born, never per mod that hears it. Already a valid trace identifier. |

## The compact ids

```wit
type signal-id = u32;
type request-id = u32;
type hook-id = u32;
type sound-id = u32;
type component-id = u32;
type field-id = u32;
type source-id = u32;
```

Names resolve once through [resolve](/reference/resolve/); hot verbs take the
id. An id lives for the session that issued it — never persisted, never a save
key. The aliases are structural at the WIT layer: the number carries no kind,
so each verb reads it in the table its own kind keeps. A `hook-id` is the
exception that never resolves by name: the declarations mint it and it arrives
with the dispatch. A `field-id` names one dotted path within one component,
numbered on first resolve. A `source-id` is an enabled mod as the stamped
origin of a signal, so a policy like "only the gamemode commands me" is one
integer compare.

## `cause`

```wit
variant cause {
  engine,
  player(session-id),
  mod(source-id),
  operator,
  platform,
}
```

Who caused an event, read through [event](/reference/event/). Five cases,
closed: it answers WHO, so a node (a WHERE) and a timer (a WHEN) are
deliberately absent — behind a timer stands the mod that armed it. `engine` is
the tick, map load and unload, physics, the default spawn. `player` carries the
session id; everything from a client arrives bound to the participant sending
it, a client mod's move included. `mod` is another mod's server half, as the
host-stamped source id. `operator` is a human with server authority acting out
of band. `platform` is an entitlement, a settlement, a ban. No case carries a
handle: authority is the dispatcher's to grant, never a passenger on a fact.

## `context`

```wit
record context {
  id: event-id,
  raised-at: u64,
  now: u64,
}
```

What every hook but `init` receives first. Three fields and they are final: a
record's field set cannot grow, so everything later about an event arrives as a
function taking the id. `raised-at` is the tick the event happened on — not
reconstructable afterwards, which is why it is carried: judging a shot,
reconciling a prediction and re-sorting two events delivered out of order all
need it. `now` is the tick the handler is running on, equal to `raised-at`
only when nothing queued in between.

## The math records

```wit
record vec3 { x: f32, y: f32, z: f32 }
record quat { x: f32, y: f32, z: f32, w: f32 }
record rgba { r: f32, g: f32, b: f32, a: f32 }
```

## `physics-object`

```wit
variant physics-object {
  player(session-id),
  entity(string),
  map-geometry,
}
```

A thing the physics world reports: a [spatial](/reference/spatial/) query
answers with these and a contact edge arrives carrying one. One vocabulary, so
the same three cases mean the same thing whether they were asked for or
arrived on an event. `player` is a participant's body, as the number that
addresses them. `entity` is the owning mod's full entity id — `""` when no
enabled archetype owns it or its owner never gave it one. `map-geometry` is
the map's own geometry.

## `field-value`

```wit
variant field-value {
  number(f32),
  boolean(bool),
  text(string),
  vec3(vec3),
  quat(quat),
  rgba(rgba),
}
```

The closed value vocabulary the host applies to component fields, written and
read through [entity](/reference/entity/) against the rows in
[Component rows](/reference/components/). A new settable component is a
registration, not a WIT change; a new shape here is the rare exception that is.

## Related

- [resolve](/reference/resolve/) — how a name becomes a compact id
- [event](/reference/event/) — reading `cause` and the instance token
- [Component rows](/reference/components/) — where `field-value` lands
- [Glossary](/glossary/) — the nouns behind these types
