---
kind: reference
area: reference
title: "client-api"
sidebar:
  order: 20
---

:::note[Generated]
From `host.wit`. Edit the WIT, not this page.
:::

## Functions

| Function | Summary |
|---|---|
| [`init`](#init) |  |
| [`on-message`](#on-message) |  |
| [`on-input`](#on-input) |  |

### `init`

```wit
init: async func();
```

_Undocumented in the WIT._

### `on-message`

```wit
on-message: async func(channel: string, data: list<u8>);
```

Bytes your server half sent with `broadcast.send` or `broadcast.send-to`.
`channel` arrives as the **bare** name — the host resolved the qualified id on
the way and hands you back what you declared, so compare against `"pressed"`
rather than the full form. Note the difference from `server-api.on-signal`,
which carries the qualified id.

### `on-input`

```wit
on-input: async func(action: string);
```

A host-published input action fired. Every action name is the host's, not
yours: declaring one under `[declares] actions` is an interest in it, never a
claim on it, and a name the host does not publish is dropped with an error
while the mod goes on running. You only hear the ones you declared.

