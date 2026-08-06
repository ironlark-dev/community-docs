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
workshop/<addon>/mods/<mod>/
  mod.toml
  ...             # built .wasm components
```

Mods build to the `wasm32-wasip2` target.

## Reference mod

The bundled `core:heartbeat` mod is a minimal end-to-end example — host ↔ mod
messaging and a simple overlay UI.
