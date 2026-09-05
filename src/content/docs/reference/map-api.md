---
kind: reference
area: reference
title: "map-api"
description: "Host-owned, read-only queries over the loaded map: its declared spawn points."
sidebar:
  order: 130
---

Part of the host contract in [`host.wit`](/host.wit). Host-owned, read-only
queries over the loaded map. One function today; the interface exists so map
facts have a home that is not the entity verbs.

Imported by the server world (`server-mod`) only.

## `spawn-points`

```wit
record spawn-point { position: vec3, yaw: f32 }
```

```wit
spawn-points: async func() -> list<spawn-point>;
```

What the loaded map suggests, not where anyone will stand: the session's
gamemode decides that and is free to ignore every one of these. Yaw is in
radians, feeding straight back into
[entity.spawn](/reference/entity/#spawn). Never empty: a map declaring none
yields the engine's own fallback point.

## Related

- [Authoring maps](/modding/maps/) — declaring spawn points
- [spawn](/reference/spawn/) — the host's own placement of arrivals
- [entity](/reference/entity/) — spawning at a point
