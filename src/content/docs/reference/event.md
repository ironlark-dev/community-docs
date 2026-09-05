---
kind: reference
area: reference
title: "event"
description: "What a hook may ask about the event it is handling: who caused it, and which entity instance it is about."
sidebar:
  order: 30
---

Part of the host contract in [`host.wit`](/host.wit). This interface answers
questions about the event a hook is handling, past the three facts the
[`context`](/reference/types/#context) record already carries. Each function
takes the event id and answers about that event alone; an id that is not the
one in flight is refused, never answered for the current one — which is what
keeps these reads from becoming an ambient read of whatever ran last.

Imported by both worlds: `server-mod` and `client-mod`.

Both functions are synchronous in spirit, like [resolve](/reference/resolve/):
they read state the store already holds. A refusal is the
[error record](/reference/types/#error).

## `cause-of`

```wit
cause-of: func(event: event-id) -> result<option<cause>, error>;
```

Who caused this event, as a [`cause`](/reference/types/#cause). The answer is
absent where the realm cannot name one: a client half does not know the
participant at its own machine. Refuses when `event` is not the event this
hook is handling.

## `instance-of`

```wit
instance-of: func(event: event-id) -> result<instance-token, error>;
```

The subject instance's generational token, for a handler that holds a handle
across events. Entity ids are reused, the token is not, so a stale holder can
never address this tick's stranger. Refuses when `event` is not the event this
hook is handling, and when the event has no subject.

## Related

- [types](/reference/types/) — `context`, `cause`, `instance-token`
- [server-api](/reference/server-api/) and [client-api](/reference/client-api/) — the hooks that receive a `context`
- [Mod lifecycle](/modding/lifecycle/) — when hooks run
