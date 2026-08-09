---
title: "Addons and identity"
description: "Where content lives, and why a name is something the installer grants rather than something a manifest claims."
sidebar:
  order: 8
---

## Addon and mod are different things

An **addon** is the container — the unit you install, remove and share, and the thing a server
enables. A **mod** is a WebAssembly component inside one. An addon may hold many mods, or
none: a pack of maps is a perfectly good addon with no code in it at all.

## The layout

```text
workshop/
  core/                          # a namespace that is itself one addon
    addon.toml
    maps/<map>/
    mods/<mod>/
  ironlark/                      # an author's namespace, holding many addons
    examples/
      addon.toml
      mods/echo/
```

`addon.toml` is what marks an addon root, and that is what makes the depth **data** rather
than a special case: a namespace that is one addon and a namespace holding several are the
same rule applied twice. Nothing in the loader special-cases a name.

It is also what lets two authors ship an addon with the same name — impossible in a flat tree
however the ids were written, because both would want one directory.

## Identity is the install path

An item is `<namespace>:<path>`:

```text
core:badgrass                    a map in the core addon
ironlark:examples/echo           a mod in the examples addon
core:balloons/balloon            an archetype published by core's balloons mod
```

**A manifest never declares its own name.** It cannot: a name a mod writes about itself could
claim any namespace, and that name is the key to the load table, the signal `source`, the
`identify`/`find` scope and every archetype prefix. Where the installer put the files is a
fact the content cannot forge, so the path is what the host trusts.

The practical consequence when authoring: **rename a directory and you have renamed the
content.** Channels, archetype refs and saved references are strings that will not follow it.

## A composed id cannot be taken apart

Depth is contextual, so nothing inside `core:balloons/balloon/alice-1` marks where the owning
mod ends and its own naming begins. Anything that needs both halves carries them as separate
values rather than splitting a string — which is why the wire format for a session's content
sends an addon and its mods as separate fields rather than joined ids.

Do not write a parser for these. Compare them.

## `core` and `ironlark`

`core` is a reserved namespace, not an author: the mandatory engine baseline — the character
body, the default gamemode, the default map. It ships with the engine, is always enabled, and
cannot be removed or disabled, so every install boots something playable with no downloads and
no config.

`ironlark` is an ordinary author handle that the platform's *optional* first-party content uses
(`ironlark:examples`). Bundled for convenience, removable, and never enabled by default — a
server opts into it exactly as it would for third-party content.

Which means `ironlark:chat` and `ullanar:chat` can coexist, and swapping one implementation for
another is a config change.

## Your own namespace

While developing locally, pick a namespace and stay in it — `tutorial/`, your handle, whatever.
Author handles become platform-assigned and signature-backed when publishing exists; until
then the namespace is honest about *placement* and says nothing about provenance.
