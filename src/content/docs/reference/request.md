---
kind: reference
area: reference
title: "request"
description: "The addressed act: one awaited answer from the server half of the mod that declared the name."
sidebar:
  order: 90
---

Part of the host contract in [`host.wit`](/host.wit). A request is the
addressed act: one awaited answer from the half of the mod that declared the
name, answered in [server-api.on-request](/reference/server-api/#on-request).
Client to server is the direction served, so the client world imports this and
the server world does not.

Imported by the client world (`client-mod`) only.

## `request`

```wit
request: async func(request: request-id, payload: list<u8>) -> result<list<u8>, error>;
```

The one awaited verb in the contract: the caller parks until the declaring
mod's server half answers, and backpressure here is what the caller asked for.
The id comes from [resolve.request](/reference/resolve/#request); routing is
already established by the declaration, so the payload carries no address.

Payload and answer are capped, and the refusal carries the cap. Refuses, as
the [error record](/reference/types/#error):

- an over-cap payload — the cap is 64 KiB;
- a forged, stale or undeclared id;
- whatever the answering half refused with, passed through;
- a lost answer — the host bounds the wait, so an answering half that never
  replies comes back as a refusal, never a hang.

## Related

- [server-api](/reference/server-api/#on-request) — the answering side
- [Requests](/modding/messaging/requests/) — designing request traffic
- [protocol schema](/modding/mod/protocol-schema/) — declaring the name
