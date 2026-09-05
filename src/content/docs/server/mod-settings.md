---
title: "Per-mod settings"
description: "The [mods] section of config/server.toml: running a mod without some of its own hooks, without disabling the mod."
kind: how-to
area: server
sidebar:
  label: "Per-mod settings"
  order: 6
---

Sometimes you want a mod, minus one thing it does: its ping key clashes with your
voice push-to-talk, or a debugging hook it ships should not be live on your server.
Disabling the whole mod throws away everything else it does. This section is the
smaller switch.

In `config/server.toml`, one table per mod, keyed by the mod's full `author:mod` id:

```toml
[mods."ironlark:echo"]
disabled-hooks = ["echo"]
```

That session runs `ironlark:echo` with its `echo` hook off: the key it is bound to
does nothing, and everything else the mod does carries on.

It is a sibling of `[session]`, not a key inside it, because the two answer
different questions: enabling a mod is the session's shape, while this is a setting
of one named mod. A mod you write no table for runs with everything on, which is
every mod by default.

## Only a mod's own hooks are switchable

A mod has two kinds of hooks, and the difference decides what you can switch:

- **Hooks the mod declares under its own name** — a control the player presses, like
  `echo` above. The mod's author invented the name and the mod's
  [manifest](/modding/mod/manifest/) declares it, which is why there is something
  for you to point at.
- **Engine hooks** — `init`, `on_tick`, `on_join` and the rest. These are the mod's
  own internals: switching one off would not be a smaller mod but a broken one,
  running half its logic. Their switch is whether the mod is
  [enabled](/server/enabled-mods/) at all.

`disabled-hooks` therefore takes the names a mod declares itself, never the engine's
words. You write the hook's name and nothing else — not which half of the mod
carries it. The setting is offered to both halves, and only a name neither declares
is a mistake.

## The exact spelling matters

The key is `disabled-hooks`, with a hyphen. A near miss like `disabled_hooks` is an
unknown key, and an unknown key refuses the whole file rather than being skipped —
see [Configuration](/server/configuration/).

A hook name that matches nothing the mod declares does not refuse the session, but
it is never silent either, because an operator who misspells one would otherwise
believe a hook is off while it stays live:

```
session: [mods."ironlark:echo"] disables the hook 'eco', which neither half of that mod declares
```

## What it looks like from the other side

For the player, the bound key simply does nothing — the press is never delivered to
the mod.

For the mod's author, nothing in their code changes and nothing errors: the handler
exists and is never called. The place this is visible is the line each mod half logs
at load, which names every hook it declares and marks the switched-off ones rather
than omitting them:

```
heard: init; silent: on_tick (not implemented), on_signal (fires for names this half subscribes to); declares: echo (input on key:f) (disabled)
```

How a mod declares such a hook and handles the press is the author's side of this
page: [Input](/modding/presentation/input/).

## Where to find the names

The mod's `mod.toml` declares them, and the load line above lists them per half.
A hook's name is the name its handler has in the mod's own source, so they are
lowercase words like `echo` or `toggle_map`.
