---
kind: reference
area: reference
title: "server-api"
sidebar:
  order: 10
---

:::note[Generated]
From `host.wit`. Edit the WIT, not this page.
:::

## Functions

| Function | Summary |
|---|---|
| [`init`](#init) |  |
| [`on-player-join`](#on-player-join) |  |
| [`on-player-leave`](#on-player-leave) |  |
| [`handle-rpc`](#handle-rpc) |  |
| [`update`](#update) | Fixed-rate server tick. |
| [`on-interact`](#on-interact) | A player used (pressed interact on) one of this mod's interactable entities. |
| [`on-signal`](#on-signal) | A signal arrived on a channel this mod subscribed to. `source` is the emitting mod's addon id, stamped by the host — unforgeable, so policy ("only the gamemode commands me", "facts only from the protocol owner") is one comparison. |
| [`on-contact`](#on-contact) | Physical touch on one of this mod's contact entities (archetypes declaring `contact = true`), for entities this mod named via `identify` — `target` is that id in the mod's own scope. |

### `init`

```wit
init: async func();
```

_Undocumented in the WIT._

### `on-player-join`

```wit
on-player-join: async func(player-id: string);
```

_Undocumented in the WIT._

### `on-player-leave`

```wit
on-player-leave: async func(player-id: string);
```

_Undocumented in the WIT._

### `handle-rpc`

```wit
handle-rpc: async func(player-id: string, method: string, args: list<u8>) -> result<list<u8>, string>;
```

_Undocumented in the WIT._

### `update`

```wit
update: async func(dt: f32);
```

Fixed-rate server tick. The server realm has no render frames (a headless server
renders nothing), so periodic mod logic runs on a fixed cadence, not per frame.
`dt` is the seconds since the previous update, so motion stays rate-independent.
The host dispatches this to every loaded server-mod and does NOT wait for it: a
slow update is skipped until it finishes, and never stalls the simulation.

### `on-interact`

```wit
on-interact: async func(player-id: string, target: string, hit-point: vec3, distance: f32);
```

A player used (pressed interact on) one of this mod's interactable entities.
The host raycasts authoritatively from the player's body and routes the hit
to the archetype owner's mod — only archetypes declaring `interact = true`
arrive here, and only for entities this mod named via `identify`. `target`
is that id in the mod's own scope, so it feeds straight into entity.find.
`hit-point` is where the use-ray struck, in world space — on a multi-part
entity it tells WHICH part was pressed; `distance` is from the presser's
body to that point, the same measure the host's reach limit enforces.

### `on-signal`

```wit
on-signal: async func(channel: string, source: string, payload: list<u8>);
```

A signal arrived on a channel this mod subscribed to. `source`
is the emitting mod's addon id, stamped by the host — unforgeable, so
policy ("only the gamemode commands me", "facts only from the protocol
owner") is one comparison. The payload carries everything the handler
needs: a signal does not synchronize with the emitter's queued entity
verbs, so "hear signal, then read the world" is an anti-pattern.

### `on-contact`

```wit
on-contact: async func(target: string, other: contact-party, point: vec3, edge: contact-edge);
```

Physical touch on one of this mod's contact entities (archetypes declaring
`contact = true`), for entities this mod named via `identify` —
`target` is that id in the mod's own scope. When both parties are contact
entities, each owner hears about its own. `point` is where the touch sits
in world space (on `ended` — where the other party separated to).

## Types

### `vec3`

```wit
record vec3 {
  x: f32,
  y: f32,
  z: f32,
}
```

Defined locally: this wit-parser rejects cross-interface `use` (same reason
map-api carries its own copy).

### `contact-party`

```wit
variant contact-party {
  player(string),
  entity(string),
  map-geometry,
}
```

What physically touched one of this mod's contact entities —
instance-exact, so "react only to THIS player / THAT balloon" is one
comparison in the handler.

### `contact-edge`

```wit
enum contact-edge { started, ended }
```

Which side of a touch interval this event marks. Only the edges cross the
boundary — never per-frame contact data; a mod that needs "while touching"
holds the interval between the two.

