---
title: "Troubleshooting"
linkTitle: "Troubleshooting"
weight: 50
description: >
  Why nothing is happening. Every entry here has cost someone an afternoon.
---

Read `logs/host.log` and `logs/client.log` beside the install. The console shows a summary;
the files carry the detail.

## Nobody spawns, and no mod seems to run

The host holds every player join until **all** server mods report loaded, so one component
that fails to load stops the whole session — not just itself. Look for a load error or an
`already loaded; ignoring` warning near session start.

Most common causes, in order:

1. **A missing export.** `server-api` needs all eight functions and `client-api` all three.
   A component missing one does not instantiate. Write the empty stubs.
2. **A stale vendored WIT.** Your `wit/deps/ironlark-host/host.wit` must match the host's
   copy. A mismatch fails to instantiate, quietly.
3. **Two mods with the same directory name.** The second is ignored with a warning.

## The session refuses to start and names two gamemodes

Working as intended. Two mods declare the gamemode role and nothing designated a holder —
pass `--gamemode <id>` or set `[session] gamemode`. See [gamemodes](../manual/gamemodes/).

## My changes to a mod have no effect

The loader prefers a built component sitting **beside `mod.toml`** and only falls back to the
cargo output under `target/`. A stale copy at that clean path therefore shadows every rebuild
you do, silently.

If behaviour does not match your source, look for `<name>_server.wasm` next to `mod.toml` and
delete it, then rebuild with `./build-mods.sh`.

## A joiner is refused, naming content

```
this session runs content this install does not have: <id>. Install it to join
```

The host runs an addon this peer does not have. Install it and rejoin — the peer deliberately
does not start with only part of a session's content, because the parts it lacks would
silently vanish from the world.

## A joiner hangs on a black screen

Usually the map: the host is on a map this peer does not have, so its world never loads. The
log says so. Note it reproduces reliably only on the **first** join in a fresh process.

## `part` or a spawn-time lookup always fails

Scene loading is asynchronous, so children do not exist during `init`. Retry from `update`
until it succeeds — that is normal, not a workaround.

## My mod's `update` seems to skip

It does. `update` is fire-and-forget: a mod still busy from the previous call is skipped, and
a full command queue drops the call. Accumulate `dt`; never count ticks. See
[limits](../manual/limits/).

## A signal never arrives

Channels are exact strings — check for a typo or a rename on either side. Also confirm you
subscribed in `init`: there is no replay, so a late subscriber misses everything already
emitted.

## Verifying a session end to end

```
CHECK=1 ./run2-local.sh
```

Runs a host and a joiner, states which properties it checked, and exits non-zero naming what
broke — rather than leaving you to interpret logs.
