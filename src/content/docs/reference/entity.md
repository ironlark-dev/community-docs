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
| [`spawn`](#spawn) | Spawn an entity from an archetype at a transform; returns its handle, or an error (e.g. unknown archetype). A bare name is one of your own declarations; another mod's is written in full — `ironlark:core:balloons/archetype/balloon`. The host name `character` resolves the built-in character body. What you spawn is yours. |
| [`control`](#control) | Bind a player controller to a body: control is `Controller -> Body`, SEPARATE from creation — spawn an entity, THEN control it. `player` is a user id. The session's gamemode alone may call it. |
| [`release`](#release) | Release an entity from its controller (inverse of `control`), and likewise the gamemode's alone. |
| [`despawn`](#despawn) | Despawn an entity (and its descendants — e.g. a glTF scene's children), destroying it in the world. Only the mod that spawned it may, unless a server grant says otherwise. |
| [`set-component`](#set-component) | Write fields into one registered component on an entity. `component` is the component's registered name (e.g. "transform"); each field patches one path within it. |
| [`get-component`](#get-component) | Read fields from one registered component on an entity — the inverse of set-component. `component` is the component's registered name (e.g. "transform"); each entry in `paths` is a dotted field path to read (e.g. "translation"). |
| [`part`](#part) | Resolve a named descendant — a part — of an entity by its stable name path ("body/skin" nests; names come from the authored scene, e.g. glTF node names, so a path survives a model re-export). |
| [`identify`](#identify) | Give an entity a stable, findable id. One name per mod, additive: yours never displaces another mod's. |
| [`find`](#find) | Resolve an id (or id prefix) to the entities carrying it, within the caller's namespace. |
| [`body-of`](#body-of) | Resolve a player's controlled body (the controller -> body relation) to an entity handle. What the handle permits is checked at each use, against the player whose event you are handling. |

### `spawn`

```wit
spawn: async func(archetype: string, at: spawn-transform) -> result<handle, string>;
```

Spawn an entity from an archetype at a transform; returns its handle, or an
error (e.g. unknown archetype). A bare `archetype` names one of the caller's own
declarations and the host qualifies it; a name carrying `:` is taken as written
and names another mod's — `ironlark:core:balloons/archetype/balloon`. Both
resolve through the content registry. A host-published name carries no `:` at
all — `character` spawns the built-in character body. Registry entities
replicate to every peer automatically.

What you spawn is **yours**: the host records you as its owner, and that is what
every other verb here checks. Spawning another mod's archetype places its
content, not its behaviour — the instance is yours to move and remove, while its
touch and use events go to the mod that declared the archetype.

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

Only the session's gamemode may possess, and no configuration can grant this to
anything else: binding a player to a body takes that player's camera and input.
The target must be a body; a body already possessed is released first, so one
body never carries two controllers.

### `release`

```wit
release: async func(entity: borrow<handle>) -> result<_, string>;
```

Release an entity from its controller (inverse of `control`), and likewise the
gamemode's alone.

### `despawn`

```wit
despawn: async func(entity: handle) -> result<_, string>;
```

Despawn an entity (and its descendants — e.g. a glTF scene's children),
destroying it in the world. Takes the handle by value (owned, NOT borrow):
despawn is the inverse of `spawn`, so it CONSUMES the handle — the entity is
gone and the handle is spent, which prevents use-after-despawn. Errors if the
entity no longer exists.

Only the mod that **spawned** an entity may destroy it — narrower than the other
verbs, because declaring an archetype lets you drive an instance while the
instance exists because someone else asked for it. A server owner can grant this
across mods for a janitor or a moderation tool; nothing reaches a player's body.
A refused despawn spends the handle too, since the verb takes it owned whether or
not the host obeys: `find` it again to address the entity.

### `set-component`

```wit
set-component: async func(entity: borrow<handle>, component: string, fields: list<component-field>) -> result<_, string>;
```

Write fields into one registered component on an entity. `component` is the
component's registered name (e.g. "transform"); each field patches one path
within it. Only whitelisted components are writable. An insertable row
(e.g. "label") is attached by its first write: the host builds the row's
registered defaults, applies your fields over them, and inserts the result
whole — one call, no declaration, no attach verb. A row that is not insertable
keeps erroring when the entity lacks the component. Errors on a forbidden or
unknown component, an unknown field path, a value-shape mismatch, or a missing
entity. This single verb stands in for per-property setters: new settable
components and fields arrive by registration, never by new verbs.

You may write an entity you spawned, and an instance of an archetype you declare
wherever it came from. A player's body only while you are handling an event about
that player — the touch or press that reached you. Outside that handler the same
call is refused, so keeping a player id does not keep the player. Anything else
needs a server owner's grant — and a grant writes the components an entity
carries, never attaches one.

A writer-scoped row (e.g. "label") also answers to the mod that wrote it: while
its value is off the row's defaults, only that mod may change it. Anyone with
write reach may still reset it to the defaults, which also releases it — writing
the defaults back is the release; there is no release verb. Per-row properties
and defaults are on the [component rows](/reference/components/) page.

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

Gated exactly like set-component, reading included: a standing read of every
player's position is a positional feed of the whole server, so a body is readable
only while you are handling that player's event.

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
Re-identifying the same entity moves YOUR id for it; an id a different live
entity already holds is rejected. Handles are ephemeral (spent on despawn, lost
on reload) — an id is the durable way to reach an entity again.

Naming is per mod and additive: one entity carries at most one name from each
mod, and yours never displaces another's. So the mod that placed a prop and the
mod whose archetype it is can both reach it.

You may name an entity you spawned, or an instance of an archetype you declare.
Not an unowned one — map content is the host's — and never a player's body.

### `find`

```wit
find: async func(pattern: string) -> result<list<handle>, string>;
```

Resolve an id (or id prefix) to the entities carrying it, within the caller's
namespace. A full id (e.g. "balloon/alice-1") returns that one entity; a prefix
(e.g. "balloon") returns every entity beneath it in the `/`-delimited hierarchy;
an empty string returns all of the addon's identified entities. Read-only: it
resolves against a host-side index and does not touch the simulation.

Only names THIS mod gave, so it never reaches across mods. An entity another mod
placed from your archetype answers here once you have named it.

### `body-of`

```wit
body-of: async func(player: string) -> result<handle, string>;
```

Resolve a player's controlled body (the controller -> body relation) to an entity
handle. This is how a mechanic mod reaches the player a hook handed it
(on-contact, on-interact) to apply an effect — teleport, launch — without the
gamemode brokering every move. Errors while the player controls no body.

Call it with the player the event you are handling is about: what the handle
permits is checked at each use, against that same player. Holding the handle
afterwards buys nothing, so there is no reason to keep one.

A cosmetic write on a body does not reach other peers — the stand-in a client
builds for a remote player is outside the component-update path — so a recolor
here is visible to nobody but the host.

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

Values are checked before anything applies, on every route: numbers, vectors,
quaternions and color channels must be finite; text is capped at 256 bytes
(refused whole, never truncated), may not contain control characters, and —
when non-empty — must put at least one visible character on screen. A field may
appear once per call. A write restating the value a field already holds is
dropped: it changes nothing and replicates nothing.

### `component-field`

```wit
record component-field {
  path: string,
  value: field-value,
}
```

One assignment: a dotted field path within a component and the value to write
at that path (e.g. path "translation" with a vec3 value).

