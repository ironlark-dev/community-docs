---
title: "entity"
description: "Server-realm entity verbs. A body is just an entity a controller drives; creation and control are separate. The verb set is fixed and generic: capability grows by whitelisting components (data), never by adding verbs."
sidebar:
  order: 30
---

:::note[Generated]
From `host.wit`. Edit the WIT, not this page.
:::

## Functions

| Function | Summary |
|---|---|
| [`spawn`](#spawn) | Spawn an entity from an archetype at a transform; returns its handle, or an error (e.g. unknown archetype). `archetype` is the publishing mod's identity then the archetype name — `core:balloons/balloon` — resolved through the content registry (the content registry); `core:character` resolves the built-in character body. |
| [`control`](#control) | Bind a player controller to a body: control is `Controller -> Body`, SEPARATE from creation — spawn an entity, THEN control it. `player` is a user id. |
| [`release`](#release) | Release an entity from its controller (inverse of `control`). |
| [`despawn`](#despawn) | Despawn an entity (and its descendants — e.g. a glTF scene's children), destroying it in the world. |
| [`set-component`](#set-component) | Write fields into one registered component on an entity. `component` is the component's registered name (e.g. "transform"); each field patches one path within it. |
| [`get-component`](#get-component) | Read fields from one registered component on an entity — the inverse of set-component. `component` is the component's registered name (e.g. "transform"); each entry in `paths` is a dotted field path to read (e.g. "translation"). |
| [`part`](#part) | Resolve a named descendant — a part — of an entity by its stable name path ("body/skin" nests; names come from the authored scene, e.g. glTF node names, so a path survives a model re-export). |
| [`identify`](#identify) | Give an entity a stable, findable id. |
| [`find`](#find) | Resolve an id (or id prefix) to the entities carrying it, within the caller's namespace. |
| [`body-of`](#body-of) | Resolve a player's controlled body (the controller -> body relation) to an entity handle. |

### `spawn`

```wit
spawn: async func(archetype: string, at: spawn-transform) -> result<handle, string>;
```

Spawn an entity from an archetype at a transform; returns its handle, or an
error (e.g. unknown archetype). `archetype` is the publishing mod's identity
then the archetype name — `core:balloons/balloon` — resolved through the
content registry (the content registry); `core:character` resolves the built-in
character body. Registry entities replicate to every peer automatically.

### `control`

```wit
control: async func(player: string, entity: borrow<handle>) -> result<_, string>;
```

Bind a player controller to a body: control is `Controller -> Body`, SEPARATE
from creation — spawn an entity, THEN control it. `player` is a
user id. On the host: the own local player's body becomes the local
player (camera + input); a remote player's body becomes the host's authoritative
simulation body for that client — driven by its input and broadcast via
WorldSnapshot. Deferred hard domino: the remote client still spawns its own
predicted body rather than instantiating this host-controlled one.

### `release`

```wit
release: async func(entity: borrow<handle>) -> result<_, string>;
```

Release an entity from its controller (inverse of `control`).

### `despawn`

```wit
despawn: async func(entity: handle) -> result<_, string>;
```

Despawn an entity (and its descendants — e.g. a glTF scene's children),
destroying it in the world. Takes the handle by value (owned, NOT borrow):
despawn is the inverse of `spawn`, so it CONSUMES the handle — the entity is
gone and the handle is spent, which prevents use-after-despawn. Errors if the
entity no longer exists.

### `set-component`

```wit
set-component: async func(entity: borrow<handle>, component: string, fields: list<component-field>) -> result<_, string>;
```

Write fields into one registered component on an entity. `component` is the
component's registered name (e.g. "transform"); each field patches one path
within it. Only whitelisted components are writable. Errors on a forbidden or
unknown component, an unknown field path, a value-shape mismatch, or a missing
entity. This single verb stands in for per-property setters: new settable
components and fields arrive by registration, never by new verbs.

### `get-component`

```wit
get-component: async func(entity: borrow<handle>, component: string, paths: list<string>) -> result<list<component-field>, string>;
```

Read fields from one registered component on an entity — the inverse of
set-component. `component` is the component's registered name (e.g. "transform");
each entry in `paths` is a dotted field path to read (e.g. "translation"). Returns
one component-field per requested path, echoing the path with its current value, so
a result feeds straight back into set-component. The same whitelist gates which
components are readable. Errors on a forbidden or unknown component, an unknown
field path, a value shape the vocabulary can't represent, or a missing entity.

### `part`

```wit
part: async func(entity: borrow<handle>, path: string) -> result<handle, string>;
```

Resolve a named descendant — a part — of an entity by its stable name path
("body/skin" nests; names come from the authored scene, e.g. glTF node
names, so a path survives a model re-export). Parts address into an
archetype's hierarchy: the returned handle feeds set-component /
get-component to touch a child's transform or material. Errors while the
part does not exist — a scene entity's children appear when its async scene
load completes, so a caller retries on a later tick.

### `identify`

```wit
identify: async func(entity: borrow<handle>, id: string) -> result<_, string>;
```

Give an entity a stable, findable id. The host records the calling mod as the
owner, so a mod can only name within its own namespace. Ids are
`/`-delimited (e.g. "balloon/alice-1") so related entities share a prefix.
Re-identifying the same entity moves its id; an id a different live entity
already holds is rejected. Handles are ephemeral (spent on despawn, lost on
reload) — an id is the durable way to reach an entity again.

### `find`

```wit
find: async func(pattern: string) -> result<list<handle>, string>;
```

Resolve an id (or id prefix) to the entities carrying it, within the caller's
namespace. A full id (e.g. "balloon/alice-1") returns that one entity; a prefix
(e.g. "balloon") returns every entity beneath it in the `/`-delimited hierarchy;
an empty string returns all of the addon's identified entities. Read-only: it
resolves against a host-side index and does not touch the simulation.

### `body-of`

```wit
body-of: async func(player: string) -> result<handle, string>;
```

Resolve a player's controlled body (the controller -> body relation) to an entity handle. This is how a mechanic mod reaches the
player a hook handed it (on-contact, on-interact) to apply an effect —
teleport, launch, recolor — without the gamemode brokering every move.
Errors while the player controls no body.

## Types

### `handle`

```wit
resource handle
```

Opaque host-issued handle to a spawned entity. Mods cannot fabricate one.

### `vec3`

```wit
record vec3 {
  x: f32,
  y: f32,
  z: f32,
}
```

### `spawn-transform`

```wit
record spawn-transform {
  position: vec3,
  yaw: f32,
}
```

### `quat`

```wit
record quat {
  x: f32,
  y: f32,
  z: f32,
  w: f32,
}
```

### `rgba`

```wit
record rgba {
  r: f32,
  g: f32,
  b: f32,
  a: f32,
}
```

### `field-value`

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

The value written into a component field: a closed vocabulary of primitive
shapes the host knows how to apply. Adding a settable *component* is data (a
registration), not a WIT change; extending this *shape* vocabulary is the rare
exception that does touch the WIT.

### `component-field`

```wit
record component-field {
  path: string,
  value: field-value,
}
```

One assignment: a dotted field path within a component and the value to write
at that path (e.g. path "translation" with a vec3 value).

