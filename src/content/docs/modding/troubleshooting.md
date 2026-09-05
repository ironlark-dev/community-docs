---
title: "Troubleshooting a mod"
description: "Your mod loads but does not behave the way you wrote it. Every entry here has cost someone an afternoon."
kind: how-to
area: modding
sidebar:
  order: 50
---

Read `logs/host.log` and `logs/client.log`, beside the install. The console
shows a summary; the files carry the detail.

If your mod does not load **at all**, or nobody can join the session, that is
a different page: [Diagnose a failed join](/server/diagnose-a-failed-join/).

## My changes have no effect

The loader prefers a built component sitting **beside `mod.toml`**
(`<mod>_server.wasm`), and only falls back to the cargo output under
`target/`. A copy at that clean path shadows every rebuild you do — but not
silently: the host warns, naming both paths, whenever the build under
`target/` is newer than the staged copy:

```text
using the staged component at ... while a newer build sits at ... —
delete the staged copy or restage it, or this build is being ignored
```

Do what the line says: delete the staged copy (or re-copy your fresh build
over it), then rebuild:

```sh
cargo build --release --target wasm32-wasip2
```

With no staged copy at all, the host reads the build output directly and there
is no copy step to forget.

## My mod loaded but none of my code runs

A mod whose manifest parses is enabled whether or not its component was ever
built. The host tells you, as an error naming the exact command:

```text
mod you:doors has a server realm that is not built: no component at ...
Build it with: cargo build --release --target wasm32-wasip2 --manifest-path ...
```

## `on_tick` never fires, or seems to skip

Two different problems:

- **It never fires at all: the hook is not declared.** The manifest routes the
  hooks, per half — an `on_tick` your `[declares.server]` (or
  `[declares.client]`) `hooks` list does not name is never handed a tick. See
  [Realms and lifecycle](/modding/lifecycle/). With the Rust SDK this cannot
  happen quietly: `#[ironlark::hooks("../mod.toml")]` makes an implemented but
  undeclared hook a compile error.
- **It fires but skips under load.** That is by design: a mod still busy from
  the previous call keeps only the newest tick. Accumulate `dt`; never count
  ticks. See [Limits and pacing](/modding/limits/).

## My manifest is refused with "no longer declares anything"

Your manifest was written against a previous grammar. If it still says
`channels`, `methods` or `actions` under `[declares]`, the host refuses it by
name and says where each declaration went:

- `channels` — a signal is a message in the mod's `protocol.proto` carrying
  `option (ironlark.signal)`.
- `methods` — a request is an `rpc` inside `service Server` in the mod's
  `protocol.proto`.
- `actions` — an input is a hook of the mod's own,
  `{ name = "...", default-bindings = [...] }` under `[declares.client]`.

See [The protocol schema](/modding/mod/protocol-schema/) and
[the manifest reference](/modding/mod/manifest/).

## My hooks list is refused with "which the schema declares"

`on_signal` and `on_request` are never listed under `hooks`. The schema beside
the manifest is the declaration: subscribing to a message is what routes
`on_signal`, and an `rpc` in `service Server` is what routes `on_request`.
Delete the word from the list; the handler itself stays.

## `part` or a spawn-time lookup always fails

Scene loading is asynchronous, so children do not exist during `init`. Retry
from `on_tick` until it succeeds — that is how the bundled `watchman` mod
places itself. That is normal, not a workaround.

## A signal never arrives

Work through these in order:

- **Both sides must compile the owner's schema.** The owner declares the
  message in its `protocol.proto`; a borrower imports that file by the owner's
  install path. A copied message is a different declaration. See
  [The protocol schema](/modding/mod/protocol-schema/).
- **The audience must reach you.** A `SERVER_MODS` signal never reaches a
  client half; only `CLIENTS` crosses the network.
- **Observe in `init`.** There is no replay, so a late subscriber misses
  everything already raised.
- **Check for a refused raise on the sending side.** A raise past the payload
  cap or the per-tick budget is refused with the cap named — see
  [Limits and pacing](/modding/limits/).

## Verifying a session end to end

Host a session and have somebody join it. In the host log, a healthy session
shows the mods loading, then the joiner being admitted, then the joiner
staying.

A player that is refused **also** logs that it entered the session, so "it
connected" proves nothing on its own. What separates the two is whether the
player is still there a moment later. For the network side, see
[Connectivity](/server/connectivity/).
