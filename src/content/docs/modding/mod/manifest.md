---
title: "mod.toml reference"
description: "Every key a mod manifest may carry, with the refusal each mistake earns. It is short on purpose: a manifest declares only what the install path cannot."
kind: reference
area: modding
sidebar:
  label: "mod.toml"
  order: 20
---

The manifest is how a mod tells the host what it is. Unknown keys under
`[declares]` are **rejected**, not skipped — a silently ignored typo is a
declaration that never applied with nothing saying so — and a manifest that
fails takes its whole mod out, loudly, naming the file and the mistake.

Two real manifests, from the bundled mods. `ironlark:echo`, the smallest mod
with both halves:

```toml
[mod]
version = "0.1.0"
description = "Client-realm smoke test: proves a round trip through the host."

# Its signal and its request are declared in protocol.proto beside this file.
# What is left here is the hook the player presses, because the binding is
# operator-and-player-facing configuration.
[declares.server]
hooks = ["on_join"]

[declares.client]
hooks = [
    { name = "echo", default-bindings = ["key:f"] },
]
```

And `ironlark:watchman`, a mod with a dependency and two archetypes:

```toml
[mod]
version = "0.1.0"
description = "A statue that glows while it has line of sight to any player."

[needs]
"ironlark:freeroam" = "^0.1"

[[declares.archetype]]
id = "watchman"
scene = "watchman.glb"
replication = "static"

[[declares.archetype]]
id = "wall"
scene = "wall.glb"
replication = "static"
contact = true

[declares.server]
hooks = ["on_tick"]
```

## `[mod]`

| Key | Required | Meaning |
|---|---|---|
| `version` | **yes** | The mod's own semantic version (`1.2.3`). Self-reported, so never evidence of what the bytes are — but it **is** what other mods' `[needs]` ranges are matched against, so a version that is not semver refuses the manifest. |
| `kind` | no | Absent means an ordinary mod. The one other value is `"pack"` — a mod that is only pins; see [Dependencies](/modding/mod/dependencies/). An unknown value refuses. |
| `description` | no | Free text for humans and launchers; the engine ignores it. |

**There is no `name` key, and adding one does nothing.** A mod's name is its
directory and its namespace is the directory above:
[identity is the install path](/modding/mod/identity/). `[mod]` is the one
table where unknown keys are tolerated, because it carries documentation the
host has no use for.

## `[needs]`

One entry per mod this one requires: the full id as the key, a semver range as
the value.

```toml
[needs]
"ironlark:freeroam" = "^0.1"
```

A key that is not an `author:mod` id, or a value that is not a version
requirement, refuses the manifest. A mod that needs itself refuses. The whole
grammar — ranges, load order, packs — is
[Dependencies](/modding/mod/dependencies/).

## `[declares]`

Optional as a whole: a mod that declares nothing parses fine. Everything a mod
claims a name for lives under this one word, and what you declare here is
addressable as `author:mod/<kind>/<name>` — the table of all six kinds is
[Declarations](/modding/mod/declarations/). Signals and requests are **not**
declared here: they live in `protocol.proto` beside the manifest (see
[The protocol schema](/modding/mod/protocol-schema/)).

| Key | Meaning |
|---|---|
| `roles` | Session roles this mod can fill. `["gamemode"]` is the only role implemented; an unknown role name refuses the manifest rather than being ignored. A role is a statement of capability — the server still names the one holder per session, and unselected candidates stay unloaded. |
| `sounds` | The sounds this mod ships. Each name is a `<name>.wav` or `<name>.ogg` file beside this manifest. The envelope is enforced when the session admits the sound: at most 4 MiB per file, 15 seconds decoded, 48 kHz, 2 channels — a declared sound that is missing or outside it takes the mod out of the session. See [Sound](/modding/presentation/sound/). |
| `body-rows` | Decoration rows this mod writes on player bodies — today exactly `label`. Declaring one is the whole permission: enabling the mod appoints it, and the session-start log is the receipt. A row the host does not classify as decoration refuses the manifest. See [Body decoration](/modding/presentation/body-decoration/). |
| `archetype` | Repeated `[[declares.archetype]]` blocks; the table below. |
| `server`, `client` | One section per half; the next heading. |

Declared content names — sounds, archetype ids — are `[a-z0-9][a-z0-9-]*`:
lowercase ASCII, digits and hyphens. **No underscores**, which is the one that
bites: `door_open` refuses the manifest. That applies to the filenames you
declare too, so ship `door-open.wav`, not `door_open.wav`. Uppercase is
rejected, not folded. (Hook names below follow the opposite rule, because they
are code identifiers.)

## `[declares.server]` and `[declares.client]`

One section per half. **The section existing is the statement that the half
exists** — that its component ships and its `init` runs. A section with no
`hooks` key, or an empty list, is a half that answers to `init` and nothing
else. A manifest with no `[declares.client]` section ships no client half.

```toml
[declares.server]
hooks = ["on_join", "on_leave", "on_tick"]
```

Each entry of `hooks` is one of two shapes, in the Cargo dependency idiom:

**A bare string names an engine hook.** The words a server half may list:
`on_join`, `on_leave`, `on_tick`, `on_interact`, `on_contact`. A client half
may list `on_tick`. Everything else refuses, each mistake by name:

- `init` — mandatory, so declaring it says nothing.
- `on_signal`, `on_request` — the schema declares them: a subscription or an
  owned request in `protocol.proto` is the statement, not a listed word.
- a hook the other half is called on, a word no hook is spelled with, or the
  same word twice.

**An object declares a hook of the mod's own** — an input hook the player can
press, reaching the client half's handler of the same name:

```toml
[declares.client]
hooks = [
    { name = "echo", default-bindings = ["key:f"] },
]
```

| Key | Meaning |
|---|---|
| `name` | The handler's own identifier: lowercase letters, digits and `_`, starting with a letter. It may not shadow an engine hook's name, and one name is declared once. |
| `default-bindings` | The controls that reach it until the player rebinds: `"<device>:<control>"`, device one of `key`, `pad`, `mouse`. A control the host does not serve refuses, naming it. An **empty list is legal** — a hook waiting for the player to bind it — but an absent key refuses: a hook with no rule at all is one nothing could invoke. |

Input is the client realm's: declaring an object hook under `[declares.server]`
refuses — a server half has no player at a keyboard. See
[Input](/modding/presentation/input/).

## `[[declares.archetype]]`

One block per entity recipe this mod publishes. What each flag does in play is
[Archetypes](/modding/mod/archetypes/).

An archetype's content is **exactly one** of `scene` and `shape`; declaring
both, or neither, refuses the manifest.

| Key | Required | Default | Meaning |
|---|---|---|---|
| `id` | **yes** | — | Name within this mod. Your own code spawns it by this bare name; another mod spawns it as `author:mod/archetype/<id>`. |
| `scene` | one of | — | glTF/`.glb` file beside `mod.toml`. |
| `shape` | one of | — | A host-built primitive; the table below. |
| `visible` | no | `true` | Shapes only: `false` keeps the collision and the touch events but renders nothing. Refused beside a `scene` — that flag is for shapes. |
| `material` | no | neutral grey | Shapes only: `{ color = "#rrggbb" }` or `"#rrggbbaa"`, hex only. Refused beside a `scene` — a model carries its own. |
| `replication` | no | `dynamic` | `static`, `dynamic` or `high-frequency`. |
| `interact` | no | `false` | Use-presses on instances reach this mod's `on_interact`. |
| `contact` | no | `false` | Touch edges on instances reach this mod's `on_contact`. |
| `solid` | no | `true` | `false` makes a pass-through trigger volume. |

### `shape`

One inline table naming a `kind` and its dimensions. The set is closed; an
unknown kind refuses.

| Kind | Dimensions | Example |
|---|---|---|
| `box` | `size = [x, y, z]` | `shape = { kind = "box", size = [4.0, 3.0, 4.0] }` |
| `sphere` | `radius` | `shape = { kind = "sphere", radius = 0.7 }` |
| `capsule` | `radius`, `length` | `shape = { kind = "capsule", radius = 0.4, length = 1.1 }` |
| `cylinder` | `radius`, `height` | `shape = { kind = "cylinder", radius = 0.5, height = 1.3 }` |

Every length is a **full extent** in meters, and every dimension must be a
positive finite number. `capsule.length` is the cylindrical segment only — the
total height is `length + 2 * radius`. Unity and Godot define capsule height
as the total, so a capsule copied from either comes out taller here unless you
subtract the two hemispheres.

The same numbers build the visual mesh and the collider, so what you see is
exactly what collides. A `material` colour with alpha below `ff` renders the
shape translucent and double-sided, so a player inside the volume still sees
it.

## Packs

`kind = "pack"` under `[mod]` makes the manifest only pins: a suite an author
ships and tests together.

```toml
[mod]
version = "2.3.0"
kind = "pack"

[needs]
"ullanar:ak12" = "=1.4.1"
```

A pack declares nothing — any `[declares]` content refuses — and every need
must pin exactly (`=x.y.z`): a range there would freeze whatever the range
happened to resolve to. See [Dependencies](/modding/mod/dependencies/).

## What is not in here

The manifest does not carry the mod's name
([the install path does](/modding/mod/identity/)), its signals or requests
([the schema does](/modding/mod/protocol-schema/)), permissions
([the server's grants do](/server/grants/)), or settings. A manifest still
written against the previous declaration grammar is refused by name, each dead
key saying where its declarations went; see
[Troubleshooting](/modding/troubleshooting/).
