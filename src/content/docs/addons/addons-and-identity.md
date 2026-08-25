---
kind: explanation
area: addons
title: "Addons and identity"
description: "Where content lives, and why a name is something the installer grants rather than something a manifest claims."
sidebar:
  order: 8
---

Every name on this page is what the engine uses today. What is still ahead is
**publishing**: an author handle becomes platform-assigned and signature-backed, so a
name you pick locally is honest about where the files sit and says nothing yet about
who shipped them. See [the roadmap](/roadmap/).

## Addon and mod are different things

An **addon** is the container — the unit you install, remove and share, and the thing a server
enables. A **mod** is a WebAssembly component inside one. An addon may hold many mods, or
none: a pack of maps is a perfectly good addon with no code in it at all.

## The layout

```text
workshop/
  ironlark/                        # an author
    core/                          # an addon
      addon.toml
      badgrass/                    # a mod shipping a map
      freeroam/                    # a mod filling the gamemode role
    examples/
      addon.toml
      echo/
  you/
    doors/
      addon.toml
      oak/
```

Three levels, always: author, addon, mod. `addon.toml` marks the addon root. There is no
`mods/` or `maps/` directory — a map is a mod that ships a `map.toml`, so a new kind of
content is a role rather than another directory, and placement cannot forge what a piece
of content is.

Three levels is also what lets two authors ship an addon of the same name, which a flat
tree could not express however the ids were written: both would want one directory.

## Identity is the install path

An id has one part per level, separated by `:`.

```text
ironlark                          an author
ironlark:core                     an addon
ironlark:core:balloons            a mod
you:doors:oak                     your own mod
```

Past the mod, `/` steps down into what that mod declares — the **kind**, then the name:

```text
ironlark:core:balloons/archetype/balloon      an archetype
ironlark:core:buttons/channel/pressed         a signal channel
ironlark:core:plates/entity/plate:main        one entity in the world
```

The kinds are `archetype`, `channel`, `method`, `action`, `sound` and `entity`. Every
one but `entity` is declared in `mod.toml` and checked when it is used, so a typo fails at
load rather than going quiet. `entity` is the exception both ways: it is never declared,
because a map's props are stamped at runtime in numbers no manifest could list, and it is
the only kind that takes an **instance** — the `:main` above, separating one member from
the family name it instantiates.

Names are lowercase `a-z`, digits and `-`. An uppercase letter is rejected rather than
folded, so one name cannot arrive by two spellings.

**A manifest never declares its own name.** It cannot: a name a mod writes about itself could
claim any namespace, and that name is the key to the load table, the signal `source`, the
`identify`/`find` scope and every archetype prefix. Where the installer put the files is a
fact the content cannot forge, so the path is what the host trusts.

The practical consequence when authoring: **rename a directory and you have renamed the
content.** Channels, archetype refs and saved references are strings that will not follow it.

## Why the depth is fixed

Three levels for a mod is a safety property, not a style choice. Equal depth means no
mod's id can be a prefix of another's, so `find` and the entity index cannot reach across
mods by accident or on purpose. Variable depth is what would allow it.

It also means a composed id is not worth taking apart. Anything needing both halves
carries them as separate values rather than splitting a string, which is why the wire
format for a session's content sends an addon and its mods as separate fields rather than
joined ids.

Do not write a parser for these. Compare them.

## The baseline, and optional first-party content

`ironlark:core` is the engine baseline: the character body, the default gamemode, the
default map. It ships with the engine, is always enabled, and cannot be removed or
disabled, so every install boots something playable with no downloads and no config.

`ironlark`'s other addons are ordinary optional content — `ironlark:examples` is bundled
for convenience and removable. Curating is opt-out: with no `addons` list at all,
everything installed runs, including this one. A server names it exactly as
it would for anyone else's.

Which is why `ironlark:chat` and `ullanar:chat` can coexist, and swapping one
implementation for another is a config change.

## Names the host publishes

A few names belong to the engine rather than to any addon, and they carry **no colon at
all** — `character`, the built-in body, is the one you will meet. That is what keeps them
from ever colliding with content: every content id has at least two colons, so no addon
can claim a host name and no host name can shadow an addon's.

## Your own namespace

While developing locally, pick an author segment and stay in it — your handle, or
`tutorial`, whatever. It is honest about *placement*; provenance arrives with publishing.
