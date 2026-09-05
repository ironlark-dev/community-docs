---
kind: reference
area: reference
title: "player"
description: "The participant resource a server hook is lent: account, persona, session id, and the controlled body."
sidebar:
  order: 50
---

Part of the host contract in [`host.wit`](/host.wit). The participant is
whoever occupies the player role, backed by a platform User or not — a bot is
a participant too. The resource is host-owned and lent per event as
`borrow<player>`: the stamped identity an author cannot fabricate or store
beyond the handler it arrived in.

Imported by the server world (`server-mod`) only; a client half never sees it.

```wit
resource player {
  user: func() -> option<user-id>;
  profile: async func() -> option<profile-id>;
  session: func() -> session-id;
  body: async func() -> result<entity-handle, error>;
}
```

`entity-handle` is the [entity](/reference/entity/) interface's `handle`
resource. A refusal is the [error record](/reference/types/#error).

## `user`

```wit
user: func() -> option<user-id>;
```

The platform account, as a session-immutable snapshot. A bot has none.
Address gameplay by session id and key saves by profile — a user id is the
platform's identity, not the server's.

## `profile`

```wit
profile: async func() -> option<profile-id>;
```

The server-local persona. A live read — the persona hot-swaps mid-session, so
never cache it across an await. A server-owned NPC may have a profile and no
user. Personas are not built: every read answers none today, and the option is
in the contract so a mod written now keys correctly when they arrive.

## `session`

```wit
session: func() -> session-id;
```

The participant's session id: never reused within the session that issued it,
present for every participant including bots, never a save key. This is the
number every verb that addresses a participant takes —
[entity.control](/reference/entity/#control),
[signal-to](/reference/signal-to/),
[session.get-all](/reference/session/#get-all).

## `body`

```wit
body: async func() -> result<entity-handle, error>;
```

The controlled body, while handling this participant's event. Refuses when the
participant controls no body. What the returned handle permits is the
[ownership rule's](/modding/world/ownership/) to decide, checked at each use.

## Related

- [session](/reference/session/) — who is connected, and their display names
- [entity](/reference/entity/) — what a body handle can do
- [World entities](/modding/world/entities/) and [Ownership](/modding/world/ownership/)
