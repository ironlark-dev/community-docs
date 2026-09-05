---
title: "The mod directory"
description: "What a mod is on disk: one directory whose path is its identity, a manifest, a schema, assets and the built components."
kind: explanation
area: modding
sidebar:
  order: 1
  label: "The unit on disk"
---

A mod is one directory under the workshop, and everything it is lives inside
it. This is the bundled `ironlark:buttons` mod, complete:

```text
workshop/
  ironlark/                 # the author
    buttons/                # the mod: its id is ironlark:buttons
      mod.toml              # the manifest: version, declarations, hooks
      protocol.proto        # what it announces, declared on the payload types
      protocol.pb           # the compiled schema the host reads
      button.glb            # an archetype's scene
      press.wav             # a declared sound
      buttons_server.wasm   # the built server half
      server/               # that half's source, a Rust crate
```

Only `mod.toml` is mandatory — it is what marks the directory as a mod. A map
mod ships a `map.toml` and a scene and no code at all; a code-only mod ships
no assets. The pieces:

- [Identity](/modding/mod/identity/) — the id is the install path,
  `author:mod`, and why a manifest never declares its own name.
- [The manifest](/modding/mod/manifest/) — every key `mod.toml` may carry,
  with the refusals each mistake earns.
- [Declarations](/modding/mod/declarations/) — the six kinds of name a mod
  publishes, which file declares each, and how another mod borrows one.
- [The protocol schema](/modding/mod/protocol-schema/) — `protocol.proto`:
  signals and requests declared on the payload types themselves.
- [Archetypes](/modding/mod/archetypes/) — publishing something that can exist
  in the world, and the flags that make it pressable, touchable or
  walk-through.
- [Dependencies](/modding/mod/dependencies/) — `[needs]`, version ranges, and
  how the load order is derived from them.

The components are build output, produced by
`cargo build --release --target wasm32-wasip2` and named
`<mod>_server.wasm` / `<mod>_client.wasm` (see
[Realms and lifecycle](/modding/lifecycle/)). During development the host also
accepts them straight from the crate's `target/` directory, so a plain build
needs no copy step — and warns if a staged copy is shadowing a newer build
(see [Troubleshooting](/modding/troubleshooting/)).
