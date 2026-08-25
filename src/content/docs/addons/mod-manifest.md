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
body-rows = ["label"]
sounds = ["press"]

[[declares.archetype]]
id = "pedestal"
scene = "pedestal.glb"
replication = "static"
interact = true

[[declares.archetype]]
id = "zone"
shape = { kind = "box", size = [4.0, 3.0, 4.0] }
visible = false
replication = "static"
contact = true
solid = false
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

Everything a mod claims a name for lives under this one word, and every key below is a
kind in the same grammar: what you declare here is addressable as
`<author>:<addon>:<mod>/<kind>/<name>`.

**Unknown keys here are rejected** and stop the manifest from parsing, because a silently
ignored typo is a declaration that never applied with nothing saying so.

| Key | Meaning |
|---|---|
| `roles` | Session roles this mod can fill. `["gamemode"]` is the only one implemented; an unrecognised role name fails the manifest rather than being ignored. A role is a statement of capability — the server still names the holder. |
| `channels` | Signal channels this mod owns. `emit` and `subscribe` accept a bare name only if it is listed here; anyone may emit on a channel you own. |
| `methods` | RPC methods this mod answers. A `call` goes to the mod that declared the method and to no other. |
| `actions` | Host input actions this mod answers in `on-input`. These are the host's names, not yours, so a name the host does not publish fails at session start. |
| `body-rows` | Decoration rows this mod writes on player bodies — today exactly `label`. Declaring one is the whole permission: enabling the addon appoints it, and the server states the declaration at session start. A row the host does not classify as decoration fails the manifest. One row has one holder per session — first in the server's addon order. See [Decorating players](/build/body-decoration/). |
| `sounds` | The sounds this mod ships. Each name is a `<name>.wav` or `<name>.ogg` file beside this manifest, and `play` accepts a bare name only if it is listed here. A declared sound with no file, or one outside the size and length envelope, takes the mod out of the session. See [Playing a sound](/build/playing-sound/). |
| `archetype` | Repeated `[[declares.archetype]]` blocks; see below. |

Every name here is `[a-z0-9][a-z0-9-]*` — lowercase ASCII, digits and hyphens. **No
underscores**, which is the one that bites: `door_open` fails the manifest, and a manifest
that fails takes the whole mod with it. That applies to filenames you declare too — a sound
shipped as `door_open.wav` cannot be declared, so name the file `door-open.wav`.
Uppercase is rejected, not folded.

A name you declare is yours: the host addresses it as
`<author>:<addon>:<mod>/<kind>/<name>`, and your code writes only the bare name.
Another mod's name is written in full, and is accepted only if that mod declares
it — which is what turns a renamed channel from a handler that silently never
runs into an error naming the manifest to check.

## `[[declares.archetype]]`

One block per entity recipe this mod declares. See [Archetypes](/addons/archetypes/) for what
each does in practice.

An archetype's content is **exactly one** of `scene` and `shape`; declaring both, or
neither, fails the manifest.

| Key | Required | Default | Meaning |
|---|---|---|---|
| `id` | **yes** | — | Name within this mod. Your own code spawns it by this bare name; another mod spawns it as `<author>:<addon>:<mod>/archetype/<id>`. |
| `scene` | one of | — | glTF/`.glb` file beside `mod.toml`. |
| `shape` | one of | — | A host-built primitive; see the table below. |
| `visible` | no | `true` | Shapes only: `false` keeps the collision and the touch events but renders nothing. Rejected beside a `scene`. |
| `material` | no | neutral grey | Shapes only: `{ color = "#rrggbb" }` or `"#rrggbbaa"`, hex only. Rejected beside a `scene` — a model carries its own. |
| `replication` | no | `dynamic` | `static`, `dynamic` or `high-frequency`. |
| `interact` | no | `false` | Use-presses on instances call `on-interact`. |
| `contact` | no | `false` | Touches on instances call `on-contact`. |
| `solid` | no | `true` | `false` makes it a pass-through trigger volume. |

### `shape`

One inline table naming a `kind` and its dimensions. The set is closed; an unknown kind or
a typoed dimension key fails the manifest naming every valid spelling.

| Kind | Dimensions | Example |
|---|---|---|
| `box` | `size = [x, y, z]` | `shape = { kind = "box", size = [4.0, 3.0, 4.0] }` |
| `sphere` | `radius` | `shape = { kind = "sphere", radius = 0.7 }` |
| `capsule` | `radius`, `length` | `shape = { kind = "capsule", radius = 0.4, length = 1.1 }` |
| `cylinder` | `radius`, `height` | `shape = { kind = "cylinder", radius = 0.5, height = 1.3 }` |

Every length is a **full extent** in meters, and every dimension must be a positive finite
number. `capsule.length` is the cylindrical segment only — the total height is
`length + 2 * radius`. Unity and Godot define capsule height as the total, so a capsule
copied from either comes out taller here unless you subtract the two hemispheres.

The same numbers build the visual mesh and the collider, so what you see is exactly what
collides. A shape has no named nodes, so parts do not apply — see
[Archetypes](/addons/archetypes/).

A `material` colour with alpha below `ff` renders the shape translucent and double-sided,
so a player inside the volume still sees it. `visible = false` with the default
`solid = true` is an invisible wall: legal, and it blocks movement and aim like any other
obstacle.

## What is not in here

The manifest cannot declare dependencies, permissions, load order, settings or a display
name. Load order is the server's enabled-set order; there is no dependency resolution yet;
per-addon settings are designed but not implemented.

If a manifest fails to parse, the mod is skipped with an error naming the file and what is
wrong. A skipped mod is one whose content and code are simply absent for the session — and if
it was your gamemode, nobody spawns.
