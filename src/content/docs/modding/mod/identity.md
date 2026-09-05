---
title: "Identity"
description: "A mod's name is where the installer put it: two levels, author then mod, and everything the mod publishes lives under that id."
kind: explanation
area: modding
sidebar:
  order: 10
---

Every name on this page is what the engine uses today. What is still ahead is
**publishing**: an author handle becomes platform-assigned and
signature-backed, so a name you pick locally is honest about where the files
sit and says nothing yet about who shipped them. See [the roadmap](/roadmap/).

## The layout

```text
workshop/
  ironlark/                 # an author
    badgrass/               # a mod shipping a map
    freeroam/               # a mod filling the gamemode role
    buttons/                # a mod shipping an archetype and code
  you/
    doors/                  # your mod
```

Two levels, always: author, then mod. A directory is a mod when it holds a
`mod.toml` (see [The mod directory](/modding/mod/)). There is no third level
and no container above the mod — a map is a mod, a suite is
[dependencies between mods](/modding/mod/dependencies/), and what a piece of
content *is* comes from what it declares, never from where it sits.

Two levels is also what lets two authors ship a mod of the same name:
`ironlark:chat` and `ullanar:chat` coexist, and swapping one implementation
for the other is a config change.

## Identity is the install path

A mod's id joins its two directory names with `:`.

```text
ironlark              an author
ironlark:buttons      a mod
you:doors             your mod
```

Past the mod, `/` steps down into what the mod declares — the **kind**, then
the name:

```text
ironlark:buttons/archetype/button     an archetype
ironlark:buttons/signal/pressed       a signal
ironlark:buttons/sound/press          a sound
ironlark:freeroam/entity/player/3     one entity, under the mod's own id for it
```

The kinds are `signal`, `archetype`, `request`, `hook`, `sound` and `entity` —
[Declarations](/modding/mod/declarations/) has the full table of what each is
and which file declares it. `entity` is the one kind never declared: an
instance gets its id at runtime, from the mod that owns it.

Author and mod names are lowercase `a-z`, digits and `-`, starting with a
letter or a digit. An uppercase letter is rejected rather than folded, because
folding would collapse two directories a filesystem keeps apart into one id.

**A manifest never declares its own name.** It cannot: a name a mod writes
about itself could claim any namespace, and that name is the key to the load
table, the signal source, the entity index and every archetype prefix. Where
the installer put the files is a fact the content cannot forge, so the path is
what the host trusts.

The practical consequence when authoring: **rename a directory and you have
renamed the content.** Signal names, archetype references and everything other
mods wrote in full are strings that will not follow it.

## Your code writes bare names; the host writes ids

A mod never spells its own id. It says `pressed`, and the host makes that
`<your id>/signal/pressed` — so a fork raises its own signals instead of the
upstream's, without editing a line. A name that already carries a `:` names
something you do not own and is taken exactly as written; that is the only way
one mod addresses another's, and the one place a full id appears in source.
See [Declarations](/modding/mod/declarations/).

## Why the depth is fixed

Equal depth is a safety property, not a style choice: no mod's id can be a
prefix of another's, so the entity index and every name lookup cannot reach
across mods by accident or on purpose. And because `:` joins levels while `/`
steps down, a directory name may carry neither — a folder named `rp:chat`
would mint a two-level address out of a one-level path, so it is refused at
discovery, loudly.

A composed id is not worth taking apart. Compare ids; do not parse them.

## Names the host publishes

A few names belong to the engine rather than to any mod, and they carry **no
colon at all** — `character`, the built-in body archetype, is the one you will
meet first. That is the whole rule and it needs no list: a host name has no
`:`, every content id has one, so the two can never collide.

## The baseline

Two bundled mods are always enabled: `ironlark:badgrass` (the default map) and
`ironlark:freeroam` (the default gamemode) — the minimum that makes a bare
session playable. `ironlark` is an ordinary author, not a reserved word, and
being non-removable is a property of that list, never of the grammar. The
other bundled mods are ordinary optional content; a server
[names them exactly as it would anyone else's](/server/enabled-mods/).

## Your own namespace

While developing locally, pick an author segment and stay in it — your handle,
or anything honest. It states *placement*; provenance arrives with publishing.
