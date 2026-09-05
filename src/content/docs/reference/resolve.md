---
kind: reference
area: reference
title: "resolve"
description: "Names resolve once to compact ids at init: signals, requests, sounds, components, field paths, and enabled mods."
sidebar:
  order: 40
---

Part of the host contract in [`host.wit`](/host.wit). Names resolve once to
compact ids, at init; one numbering serves every guest and the wire, assigned
when the enabled set publishes and carried by the session announce. Hot verbs
then take the id, never the string.

Imported by both worlds: `server-mod` and `client-mod`.

Every name-taking function follows one rule: a bare name is the caller's own
declaration, qualified by the host with the caller's mod id; a name carrying
`:` is a declared cross-mod reference, taken as written. An undeclared name is
refused here, at init, not discovered dead mid-session. A refusal is the
[error record](/reference/types/#error). What a mod declares and where is
covered by [Declarations](/modding/mod/declarations/) and the
[protocol schema](/modding/mod/protocol-schema/).

There is no hook function here: a [`hook-id`](/reference/types/#the-compact-ids)
is minted by the declarations and arrives with the dispatch.

## `signal`

```wit
signal: func(name: string) -> result<signal-id, error>;
```

The compact id of a declared signal, for [signal](/reference/signal/) and
[signal-to](/reference/signal-to/). Refuses an undeclared name, a name declared
as a request, and a name whose declared audience gives the caller's realm no
part in it.

## `request`

```wit
request: func(name: string) -> result<request-id, error>;
```

The compact id of a declared request, for [request](/reference/request/). Both
realms hold the id: one half asks, the other answers what
`server-api.on-request` hands it. Refuses an undeclared name and a name
declared as a signal.

## `sound`

```wit
sound: func(name: string) -> result<sound-id, error>;
```

The compact id of a declared sound, for [audio](/reference/audio/). Refuses a
name no enabled mod declares.

## `component`

```wit
component: func(name: string) -> result<component-id, error>;
```

A host-published accessible component, for
[entity.set-component and entity.get-component](/reference/entity/). The
accessible set is the whitelist in [Component rows](/reference/components/);
any other name refuses.

## `field`

```wit
field: func(component: component-id, path: string) -> result<field-id, error>;
```

A dotted path within a component (`"translation"`, `"base_color"`), numbered
on first resolve. The id only names the string once; whether the path exists
is the world's to judge at first use. Refuses a forged or stale component id.

## `source`

```wit
source: func(name: string) -> result<source-id, error>;
```

An enabled mod's full id — `author:mod` — as the integer that signal dispatch
stamps as origin. This is what makes origin policy one compare: resolve the
gamemode's id once, then match it against the `source` your `on-signal` hook
receives. Refuses a mod that is not enabled this session.

## Related

- [types](/reference/types/) — the compact id aliases and their lifetimes
- [Declarations](/modding/mod/declarations/) — what a manifest declares
- [Mod identity](/modding/mod/identity/) — the `author:mod` id form
