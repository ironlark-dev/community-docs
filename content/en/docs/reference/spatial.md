---
title: "spatial"
linkTitle: "spatial"
weight: 40
description: >
  Read-only spatial queries over the physical world (ADR 0026): the sensing
  counterpart of contact events. Sees map colliders and flagged-entity
  proxies (archetypes with `interact`/`contact`); character bodies are not
  raycastable. A hit on another mod's entity reports geometry but no handle —
  cross-mod reach stays the signal bus, matching `find`'s namespace scoping.
---

{{% alert title="Generated" color="info" %}}
From `host.wit`. Edit the WIT, not this page.
{{% /alert %}}

## Functions

| Function | Summary |
|---|---|
| [`raycast`](#raycast) | Cast a ray and return the closest hit within `max-distance`, if any. |
| [`overlap`](#overlap) | The caller's own identified entities whose collision intersects the sphere. |

### `raycast`

```wit
raycast: async func(origin: vec3, direction: vec3, max-distance: f32) -> option<ray-hit>;
```

Cast a ray and return the closest hit within `max-distance`, if any.

### `overlap`

```wit
overlap: async func(center: vec3, radius: f32) -> list<handle>;
```

The caller's own identified entities whose collision intersects the
sphere. Result count is capped like `find`'s.

## Types

### `handle`

```wit
type handle = handle;
```

### `vec3`

```wit
record vec3 {
  x: f32,
  y: f32,
  z: f32,
}
```

### `ray-hit`

```wit
record ray-hit {
  entity: option<handle>,
  position: vec3,
  normal: vec3,
  distance: f32,
}
```

The closest thing a ray hit: where and how far, plus the entity when the
hit resolved to one of the CALLER's own identified entities (absent for
map geometry and foreign entities — they occlude, nothing more).

