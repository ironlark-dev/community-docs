---
title: "Dependencies"
description: "The [needs] table: version ranges, how the load order is derived from them, and packs — the mod kind that is only pins."
kind: reference
area: modding
sidebar:
  order: 60
---

A mod states what it needs in [its manifest](/modding/mod/manifest/): the full
[id](/modding/mod/identity/) of each mod it depends on, and the versions of it
this one works with. The bundled `ironlark:watchman`, which reads a fact the
gamemode publishes, is the live example:

```toml
[needs]
"ironlark:freeroam" = "^0.1"
```

## Ranges

The value is a semver requirement, matched against the `[mod] version` the
installed copy of that mod states:

| Written | Accepts |
|---|---|
| `"^1.2"` | `1.2.0` up to, not including, `2.0.0` |
| `">=2, <4"` | any `2.x.y` or `3.x.y` |
| `"=1.4.1"` | exactly `1.4.1` |

An install holds **one version per mod id**, so there is nothing to solve: a
range either matches the installed version or the session refuses to start,
naming both the requirement and what is actually installed. A key that is not
an `author:mod` id, or a value that is not a requirement, refuses the manifest
itself — and a mod that needs its own id refuses too.

## Enabling and load order

Enabling a mod enables its needs: the session's set is the **closure** over
`[needs]` of what the server asked for, so an operator lists what they want
and never its plumbing. See [Choosing mods](/server/enabled-mods/).

The load order — and with it `init` order, the same on every peer — is derived
from the same table:

- **Dependencies load before dependents.** `watchman` loads after `freeroam`,
  always.
- **The two baseline mods lead**, being everyone's floor.
- **The operator's list order is only the tiebreak** between mods neither of
  which needs the other, and a mod the closure pulled in takes the position of
  its earliest requirer.
- **A cycle refuses the session**, naming the mods in it.

The session-start log states the derived order, one pinned `id@version` per
mod — that line is the receipt for everything on this page.

## Packs: a suite as one name

A pack is a mod that is only pins — `kind = "pack"` under `[mod]` — for an
author who ships and tests several mods as one product:

```toml
[mod]
version = "2.3.0"
kind = "pack"

[needs]
"ullanar:ak12" = "=1.4.1"
"ullanar:ak12-maps" = "=0.3.0"
```

Two rules, both enforced at the manifest:

- **A pack pins exactly** (`=x.y.z`). Its members take ranges on the libraries
  *they* use; the pack's job is to name the combination that was tested, and a
  range there would freeze whatever it happened to resolve to.
- **A pack declares nothing.** No archetypes, no sounds, no hooks, no code.
  Enabling the pack is enabling its members; the pack itself is not announced
  to joining peers, because there is nothing of it to run.

Versioning the pack is versioning the suite: bumping one member's pin is a new
pack version, which is what a server operator actually upgrades.
