---
kind: reference
area: reference
title: "spawn"
description: "Placement of arriving participants: the gamemode turns the host's auto-spawn on or off."
sidebar:
  order: 140
---

Part of the host contract in [`host.wit`](/host.wit). Placement of arriving
participants. Only the session's gamemode may command it; anyone else is
refused with the answer, not in a log. These are commands rather than a
setting: what the session does with placement will grow, and a frozen status
could not grow with it.

Imported by the server world (`server-mod`) only.

A refusal is the [error record](/reference/types/#error).

## `enable-auto`

```wit
enable-auto: async func() -> result<_, error>;
```

The host places every arrival in a body of its own accord. This is the state a
session starts in — on unless a gamemode turns it off. Refuses any caller that
is not the session's gamemode.

## `disable-auto`

```wit
disable-auto: async func() -> result<_, error>;
```

The host stops placing arrivals, leaving them to the gamemode — typically
[entity.spawn](/reference/entity/#spawn) followed by
[entity.control](/reference/entity/#control) from an
[on-join](/reference/server-api/#on-join) handler. Nobody already in the
session moves. Refuses any caller that is not the session's gamemode.

## Related

- [Ownership](/modding/world/ownership/) — the gamemode role and its reach
- [map-api](/reference/map-api/) — where the map suggests placing people
- [Server configuration](/server/configuration/) — designating the gamemode
