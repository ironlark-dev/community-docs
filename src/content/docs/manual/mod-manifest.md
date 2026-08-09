---
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

[provides]
roles = ["gamemode"]

[[provides.archetype]]
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

## `[provides]`

Optional as a whole: a mod that publishes no content and fills no role can omit it.

**Unknown keys here are rejected** and stop the manifest from parsing, because a silently
ignored typo is a declaration that never applied with nothing saying so.

| Key | Meaning |
|---|---|
| `roles` | Session roles this mod can fill. `["gamemode"]` is the only one implemented; an unrecognised role name fails the manifest rather than being ignored. A role is a statement of capability — the server still names the holder. |
| `archetype` | Repeated `[[provides.archetype]]` blocks; see below. |

## `[[provides.archetype]]`

One block per publishable entity recipe. See [Archetypes](../archetypes/) for what each does
in practice.

| Key | Required | Default | Meaning |
|---|---|---|---|
| `id` | **yes** | — | Name within this mod. Spawned as `<namespace>:<mod>/<id>`. |
| `scene` | **yes** | — | glTF/`.glb` file beside `mod.toml`. |
| `replication` | no | `static` | `static`, `dynamic` or `high-frequency`. |
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
