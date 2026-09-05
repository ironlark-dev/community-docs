---
kind: reference
area: reference
title: "entity"
description: "Server-realm entity verbs: spawn and despawn, control and release, component reads and writes, ids and lookup."
sidebar:
  order: 100
---

Part of the host contract in [`host.wit`](/host.wit). These are the
server-realm entity verbs: creation and control are separate, and the verb set
is fixed — capability grows by whitelisting components in
[Component rows](/reference/components/), never by adding verbs. How far any
verb reaches is the [ownership rule's](/modding/world/ownership/) to decide,
checked at each use.

Imported by the server world (`server-mod`) only.

Refusals are the [error record](/reference/types/#error). Two shared shapes:

```wit
resource handle;
```

An opaque host-issued handle; mods cannot fabricate one. A handle is not
authority — what it permits is checked at each use.

```wit
record spawn-point { position: vec3, yaw: f32 }
```

## `spawn`

```wit
spawn: async func(archetype: string, at: spawn-point) -> result<handle, error>;
```

Spawns an instance of an [archetype](/modding/mod/archetypes/). A bare
archetype name is the caller's own declaration; a name carrying `:` names
another mod's. What you spawn is yours to move and remove; its interact and
contact events go to the declaring mod. Placement candidates come from
[map-api.spawn-points](/reference/map-api/#spawn-points) or anywhere you
choose.

## `control`

```wit
control: async func(player: session-id, entity: borrow<handle>) -> result<_, error>;
```

Binds a participant's camera and input to a body. An already-possessed body is
released first. Gamemode-only: any other caller is refused.

## `release`

```wit
release: async func(entity: borrow<handle>) -> result<_, error>;
```

The inverse of `control`, likewise the gamemode's alone.

## `despawn`

```wit
despawn: async func(entity: handle) -> result<_, error>;
```

Consumes the handle: the entity is gone and the handle is spent, even on
refusal. Only the spawner may despawn.

## `set-component`

```wit
record component-field {
  field: field-id,
  value: field-value,
}
```

```wit
set-component: async func(
  entity: borrow<handle>,
  component: component-id,
  fields: list<component-field>,
) -> result<_, error>;
```

Writes fields into one registered component. Ids come from
[resolve.component and resolve.field](/reference/resolve/#component); values
take the [field-value](/reference/types/#field-value) shapes. Only whitelisted
rows are writable; an insertable row is attached by its first write. A
player's body is reachable only while handling that player's event, or through
a declared [body decoration row](/modding/presentation/body-decoration/). A
write restating the held value is dropped.

## `get-component`

```wit
get-component: async func(
  entity: borrow<handle>,
  component: component-id,
  fields: list<field-id>,
) -> result<list<component-field>, error>;
```

The inverse of `set-component`, gated exactly like it, reads included: a
standing read of every body would be a positional feed of the whole server.

## `part`

```wit
part: async func(entity: borrow<handle>, path: string) -> result<handle, error>;
```

Resolves a named descendant by its authored scene path (`"body/skin"`).
Refuses while the part does not exist yet; retry on a later tick.

## `set-id`

```wit
set-id: async func(entity: borrow<handle>, id: string) -> result<_, error>;
```

Gives an entity a stable, findable id in the caller's namespace. An id is per
mod and additive, and it routes nothing: an event reaches the mod that
declared the archetype, and the id only travels with it. A mod may give an id
to a body it spawned itself; map content never takes one.

## `find`

```wit
find: func(pattern: string) -> result<list<handle>, error>;
```

Resolves an id or `/`-prefix to entities, within the caller's own ids — a
prefix like `"pair/"` matches the family it names.

## `by-id`

```wit
by-id: func(id: string) -> result<option<handle>, error>;
```

The one entity carrying exactly this id, in the caller's own ids. `find`
matches a family; this matches one id. Absent means nothing holds it, which
includes an instance that was never given one.

## `body-of`

```wit
body-of: async func(player: session-id) -> result<handle, error>;
```

The controller → body relation for the participant whose event is being
handled; what the handle permits is checked at each use. The same answer the
[player resource's `body`](/reference/player/#body) gives, for when you hold a
session id rather than the resource.

## Related

- [World entities](/modding/world/entities/) — the model behind the verbs
- [Ownership](/modding/world/ownership/) — who may do what to which entity
- [Component rows](/reference/components/) — every readable and writable row
- [Interaction](/modding/world/interaction/) and [Contact](/modding/world/contact/) — the events these entities raise
