---
kind: reference
area: reference
title: "session"
description: "Who is connected right now, and the server-resolved facts about one of them as named string values."
sidebar:
  order: 170
---

Part of the host contract in [`host.wit`](/host.wit). The session roster: who
is connected, and the server-resolved facts about one of them as named string
values. Read-only; the host owns the table.

Imported by both worlds: `server-mod` and `client-mod`.

Neither function refuses: an empty answer is the honest answer when the
session is going away under the question.

## `participants`

```wit
participants: async func() -> list<session-id>;
```

Everyone connected right now, as the ids mods address them by. A snapshot:
someone may arrive or leave before the caller acts on the answer. For
membership changes as they happen, a server half handles
[on-join and on-leave](/reference/server-api/#on-join) instead of polling.

## `get-all`

```wit
get-all: async func(player: session-id) -> list<tuple<string, string>>;
```

The named values the session holds for a participant. The one fact served is
the display name, under `"name"`. An unknown participant is an empty list.
Names are not identities: address by id, show by name.

## Related

- [player](/reference/player/) — the per-event participant resource
- [signal-to](/reference/signal-to/) — sending to one participant by session id
