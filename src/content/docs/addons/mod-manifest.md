---
kind: reference
area: addons
title: "mod.toml reference"
description: "Every key a mod manifest may carry. It is short on purpose: a manifest declares only what the install path cannot."
sidebar:
  label: "mod.toml"
  order: 34
---

```toml
[mod]
version = "0.1.0"
description = "optional, for humans"

[declares]
roles = ["gamemode"]
channels = ["opened"]
methods = ["buy"]
actions = ["echo"]

[[declares.archetype]]
id = "zone"
scene = "zone.glb"
replication = "static"
interact = false
contact = false
solid = true
```

## `[mod]`

| Key | Required | Meaning |
|---|---|---|
| `version` | **yes** | The mod's own version. Self-reported, so it is good for display and for spotting drift — never treated as evidence of anything. |

**There is no `name` key, and adding one does nothing.** A mod's name is its directory and its
namespace is the directory above; identity comes from where the installer put the files. A
name a mod writes about itself could claim any namespace, which is exactly what identity must
not allow.

Unknown keys in `[mod]` are tolerated — `description` is conventional and ignored by the
engine.

## `[declares]`

Optional as a whole: a mod that declares no content and fills no role can omit it.

Everything a mod claims a name for lives under this one word. `archetype` is the kind that
exists today; the grammar reserves `channel`, `method`, `action` and `feature` for the same
place.

**Unknown keys here are rejected** and stop the manifest from parsing, because a silently
ignored typo is a declaration that never applied with nothing saying so.

| Key | Meaning |
|---|---|
| `roles` | Session roles this mod can fill. `["gamemode"]` is the only one implemented; an unrecognised role name fails the manifest rather than being ignored. A role is a statement of capability — the server still names the holder. |
| `channels` | Signal channels this mod owns. `emit` and `subscribe` accept a bare name only if it is listed here; anyone may emit on a channel you own. |
| `methods` | RPC methods this mod answers. A `call` goes to the mod that declared the method and to no other. |
| `actions` | Host input actions this mod answers in `on-input`. These are the host's names, not yours, so a name the host does not publish fails at session start. |
| `archetype` | Repeated `[[declares.archetype]]` blocks; see below. |

Every name here is `[a-z0-9][a-z0-9-]*` — lowercase ASCII, digits and hyphens.
Uppercase is rejected, not folded.

A name you declare is yours: the host addresses it as
`<author>:<addon>:<mod>/<kind>/<name>`, and your code writes only the bare name.
Another mod's name is written in full, and is accepted only if that mod declares
it — which is what turns a renamed channel from a handler that silently never
runs into an error naming the manifest to check.

## `[[declares.archetype]]`

One block per entity recipe this mod declares. See [Archetypes](/addons/archetypes/) for what
each does in practice.

| Key | Required | Default | Meaning |
|---|---|---|---|
| `id` | **yes** | — | Name within this mod. Your own code spawns it by this bare name; another mod spawns it as `<author>:<addon>:<mod>/archetype/<id>`. |
| `scene` | **yes** | — | glTF/`.glb` file beside `mod.toml`. |
| `replication` | no | `dynamic` | `static`, `dynamic` or `high-frequency`. |
| `interact` | no | `false` | Use-presses on instances call `on-interact`. |
| `contact` | no | `false` | Touches on instances call `on-contact`. |
| `solid` | no | `true` | `false` makes it a pass-through trigger volume. |

## What is not in here

The manifest cannot declare dependencies, permissions, load order, settings or a display
name. Load order is the server's enabled-set order; there is no dependency resolution yet;
per-addon settings are designed but not implemented.

If a manifest fails to parse, the mod is skipped with an error naming the file and what is
wrong. A skipped mod is one whose content and code are simply absent for the session — and if
it was your gamemode, nobody spawns.
