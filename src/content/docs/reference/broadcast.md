---
kind: reference
area: reference
title: "broadcast"
sidebar:
  order: 60
---

:::note[Generated]
From `host.wit`. Edit the WIT, not this page.
:::

## Functions

| Function | Summary |
|---|---|
| [`send`](#send) | Send bytes to every player's client half on a declared channel. |
| [`send-to`](#send-to) | Send bytes to one player's client half, addressed by user id. |

### `send`

```wit
send: async func(channel: string, data: list<u8>) -> result<_, string>;
```

Send bytes to every connected player's client half. A bare `channel` is one of
your own declarations; another mod's is written in full. Either way some mod must
declare it, so a name nobody published is an error at the call rather than a
message nobody receives.

### `send-to`

```wit
send-to: async func(player-id: string, channel: string, data: list<u8>) -> result<_, string>;
```

Send bytes to one player's client half, addressed by user id. `channel` resolves
exactly as for [`send`](#send).

