---
kind: reference
area: reference
title: "rpc-out"
description: "A client half asks its server half a question and waits for the answer. Client realm only, and the method must be one your mod declared."
sidebar:
  order: 70
---

:::note[Generated]
From `host.wit`. Edit the WIT, not this page.
:::

Imported by a mod's client half only. The answer comes back from
`server-api.handle-rpc`.

## Functions

| Function | Summary |
|---|---|
| [`call`](#call) | Ask the server half a question and wait for its answer. |

### `call`

```wit
call: async func(method: string, args: list<u8>) -> result<list<u8>, string>;
```

A client-to-server request, answered in `server-api.handle-rpc`. `method` is a
bare name your own mod declared under `[declares] methods`; the host qualifies
it and delivers the call to the one mod that declared it. A name carrying `:`
names another mod's method. An undeclared name is refused here, rather than
becoming a call every loaded mod is asked to answer in turn.

