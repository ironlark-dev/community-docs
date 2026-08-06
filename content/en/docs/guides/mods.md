---
weight: 20
title: Mods
---

{{% alert title="Work in progress" color="warning" %}}
The modding API is evolving; treat specifics here as a sketch, not a stable
contract.
{{% /alert %}}

A **mod** is a WebAssembly component that adds gameplay the host has no opinion
about — items, rules, AI, UI. The host stays gameplay-agnostic; mods provide the
opinions.

## Realms: server and client

Following the gmod model, a mod has two halves:

- **Server** (`<mod>_server.wasm`) — runs only on the host; authoritative.
- **Client** (`<mod>_client.wasm`) — runs on every peer; presentation and input.

The two halves share types via a typed interface; traffic between *different*
mods stays opaque bytes, so the host never needs to understand mod content.

## Layout

```text
workshop/<namespace>[/<addon>]/mods/<mod>/
  mod.toml
  <mod>_server.wasm    # built components (not committed — build them)
  <mod>_client.wasm
```

A mod's identity comes from that path, never from the manifest — `core:freeroam`,
`ironlark:examples/echo`.

Mods build to the `wasm32-wasip2` target as WebAssembly **components**. See
[Choosing a language](/docs/manual/languages/) for what that requires.

## Reference mod

The bundled `ironlark:examples/echo` mod is the minimal end-to-end example, and the
only one shipping both realms: a keypress becomes an RPC, the server half
broadcasts the new value, and both peers' client halves render it.
