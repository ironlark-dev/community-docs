---
title: "Troubleshooting a mod"
description: "Your mod loads but does not behave the way you wrote it. Every entry here has cost someone an afternoon."
kind: how-to
area: build
sidebar:
  order: 90
---

Read `logs/host.log` and `logs/client.log`, beside the install. The console shows a
summary; the files carry the detail.

If your mod does not load **at all**, or nobody can join the session, that is a
different page: [Diagnose a failed join](/server/diagnose-a-failed-join/).

## My changes have no effect

The loader prefers a built component sitting **beside `mod.toml`**, and only falls back
to the cargo output under `target/`. A stale copy at that clean path shadows every
rebuild you do, silently.

If behaviour does not match your source, look for `<name>_server.wasm` next to
`mod.toml`, delete it, and rebuild with `cargo build --release` from the mod
directory.

## `part` or a spawn-time lookup always fails

Scene loading is asynchronous, so children do not exist during `init`. Retry from
`update` until it succeeds. That is normal, not a workaround.

## My `update` seems to skip

It does. `update` is fire-and-forget: a mod still busy from the previous call is
skipped, and a full command queue drops the call.

Accumulate `dt`; never count ticks. See [Limits and pacing](/build/limits/).

## A signal never arrives

Channels are exact strings, so check for a typo or a rename on either side. Also
confirm you subscribed in `init` — there is no replay, so a late subscriber misses
everything already emitted. See [Signals](/build/signals/).

## Verifying a session end to end

Host a session and have somebody join it. In the host log, a healthy session shows the
mods loading, then the joiner being admitted, then the joiner staying.

A player that is refused **also** logs that it entered the session, so "it connected"
proves nothing on its own. What separates the two is whether the player is still there
a moment later.
