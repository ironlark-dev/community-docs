---
kind: reference
area: reference
title: "spatial"
description: "Read-only spatial queries: raycast and shape intersections, answering with the shared physics-object vocabulary."
sidebar:
  order: 120
---

Part of the host contract in [`host.wit`](/host.wit). Read-only spatial
queries, the sensing counterpart of [contact events](/modding/world/contact/):
where contact tells you what touched your archetypes, these answer what is out
there when you ask. A hit on a foreign entity reports geometry but no handle.

Imported by the server world (`server-mod`) only.

Neither function refuses: an empty answer is an answer. Results speak the
shared [physics-object](/reference/types/#physics-object) vocabulary, so the
same three cases mean the same thing here and on a contact event.

## `raycast`

```wit
record ray-hit {
  entity: option<handle>,
  position: vec3,
  normal: vec3,
  distance: f32,
}
```

```wit
raycast: async func(origin: vec3, direction: vec3, max-distance: f32) -> option<ray-hit>;
```

The first thing the ray hits within `max-distance`, or nothing. The hit's
`entity` is a [handle](/reference/entity/) only when the hit is one of the
caller's own; a foreign entity or map geometry answers position, normal and
distance with no handle.

## `intersections`

```wit
variant shape {
  %box(vec3),
  sphere(f32),
  capsule(tuple<f32, f32>),
  cylinder(tuple<f32, f32>),
}
```

The probe an intersection query is asked with — the same four kinds an
archetype declares in its [manifest](/modding/mod/archetypes/), so one shape
vocabulary serves both. Every length is a full extent; a capsule's length is
the cylindrical segment alone.

```wit
intersections: async func(shape: shape, at: vec3, facing: quat) -> list<physics-object>;
```

Everything in the world the probe touches, placed at `at` and turned by
`facing`. Intersecting, not containing: a body the probe catches by an edge is
in the answer. The probe is not in the world and blocks nothing.

Identity only, never a handle: acting on one of the caller's own goes through
[entity.by-id](/reference/entity/#by-id), and reach is the
[ownership rule's](/modding/world/ownership/) to decide.

## Related

- [Spatial sensing](/modding/world/spatial/) — patterns and costs
- [Contact](/modding/world/contact/) — the event-driven counterpart
- [types](/reference/types/#physics-object) — the answer vocabulary
