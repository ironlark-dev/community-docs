---
title: "Realms and the session lifecycle"
description: "A mod has up to two halves with different imports and powers, its manifest routes which hooks reach each one, and both are loaded and torn down per session."
kind: explanation
area: modding
sidebar:
  label: "Realms and lifecycle"
  order: 20
---

A mod ships up to two WebAssembly components, and the host loads them in
different places with different powers. This page is where "server half" and
"client half" get their exact meaning; [What a mod is](/modding/) is the one
line version.

## Two realms, two import sets

Each half implements one world of the contract, and a world's import set is
the whole of what that half can do — there is no permission check behind it,
the function simply is not there to call.

| | `<mod>_server.wasm` | `<mod>_client.wasm` |
|---|---|---|
| Runs on | the machine hosting the session | every player's machine, the host included |
| Authority | decides what is true | presents it to one player |
| Imports | `log`, `resolve`, `event`, `player`, `session`, `audio`, `entity`, `spawn`, `map-api`, `signal`, `signal-to`, `spatial` | `log`, `resolve`, `event`, `session`, `audio`, `ui`, `signal`, `request` |
| Exports | `server-api` | `client-api` |

Every interface has [a reference page](/reference/). The differences carry the
design:

- Only the server half imports [`entity`](/reference/entity/), `spawn` and
  [`spatial`](/reference/spatial/) — a client half physically cannot spawn,
  move or probe the world. Anything authoritative lives on the server and
  reaches players as messages.
- Only the server half imports `signal-to`, the raise narrowed to one
  player's machine. A client half has no other machines to reach.
- Only the client half imports `request` — asking is client-to-server, and the
  server half is the one that answers. See
  [Requests](/modding/messaging/requests/).
- Both import [`signal`](/reference/signal/) and [`audio`](/reference/audio/):
  a server raise lands on the server realm's bus (or crosses, if the name says
  so), a server sound plays for everyone; a client raise and a client sound
  stay on that one machine.

A mod may ship only a server half, and most do. You need a client half only to
put something on a player's screen or to react to a key.

## One trait per half, empty default bodies

A half is one implementation of `ServerMod` or `ClientMod` from the Rust SDK.
Every hook has an empty default body, so you write only the hooks you answer —
there are no stubs to copy:

```rust
use ironlark::server::prelude::*;

struct Mode;

#[ironlark::hooks("../mod.toml")]
impl ServerMod for Mode {
    async fn init() {}
    async fn on_tick(_ctx: Context, _dt: f32) {}
}

ironlark::export_server!(Mode);
```

This block pairs with a manifest whose `[declares.server]` lists exactly
`["on_tick"]` — `init` is implemented freely, being mandatory.

`#[ironlark::hooks("../mod.toml")]` holds the impl block and the manifest
together, both ways: a hook the manifest declares that the block does not
implement is a compile error, and so is a hook the block implements that the
manifest does not declare. The manifest and the code cannot quietly disagree.

## The manifest routes the hooks

Which hooks actually reach a half is declared in the manifest, per half,
because the two implement separate traits and `on_tick` exists on both:

```toml
[declares.server]
hooks = ["on_join", "on_leave", "on_tick"]
```

That is the shipped `ironlark:freeroam` gamemode's own declaration. The rules,
each enforced by a named refusal at the manifest:

- **The section existing is the statement that the half exists.** A manifest
  with no `[declares.client]` section ships no client half; a section with no
  `hooks` key (or an empty list) is a half whose `init` runs and nothing else.
- **`init` is mandatory and never declared.** Every loaded half's `init` runs;
  listing it is refused because it would say nothing.
- **The declarable words are the engine hooks of that half's trait.** A server
  half may name `on_join`, `on_leave`, `on_tick`, `on_interact` and
  `on_contact`; a client half may name `on_tick`. An undeclared hook is never
  handed work — a tick you forgot to declare does not fire, which is the most
  common first-mod surprise (see
  [Troubleshooting](/modding/troubleshooting/)).
- **`on_signal` and `on_request` are not declarable.** The schema beside the
  manifest declares them: subscribing to a message is the statement that
  `on_signal` matters, an `rpc` in `service Server` is the statement that
  `on_request` does. Listing either word is refused, naming the rule. See
  [The protocol schema](/modding/mod/protocol-schema/).
- **A mod's own hooks are objects, client-only.** An entry like
  `{ name = "echo", default-bindings = ["key:f"] }` declares an input hook the
  player can press; a server half has no player at a keyboard, so declaring one
  there is refused. See [Input](/modding/presentation/input/) and
  [the manifest reference](/modding/mod/manifest/).

## The session load chain

Content is decided when a **session** starts, not when the process starts.
Install a mod while sitting in the menu and the next session picks it up.

Entering a session runs this chain, each step reading the one before:

1. **Scan** — walk the content root and read every manifest. A manifest that
   does not parse skips its whole mod, loudly.
2. **Resolve the enabled set** — the host closes over every enabled mod's
   needs and derives the load order (see
   [Dependencies](/modding/mod/dependencies/)); a joining peer adopts the
   host's announced set instead.
3. **Admit declared sounds** — a declared sound whose file is missing or
   outside the envelope takes its mod out of the session, on the host.
4. **Publish declarations and build the registry** — every declared name is
   numbered, and the archetypes of *enabled* mods only are indexed, so a
   disabled mod's scenes never reach the asset loader.
5. **Load server halves** — on the hosting machine only.
6. **Load client halves** — on every machine, the host included.
7. Each loaded half's **`init`** runs.

Two consequences worth internalising:

- **`init` is early.** Scene loading is asynchronous, so colliders and scene
  children may not exist yet. Work that needs the world belongs in `on_tick`,
  retried until it succeeds — that is how the bundled `watchman` mod places
  itself.
- **A mod that fails to load does not block joins.** The host waits for every
  queued mod to report an *outcome*, not a success. A half that cannot
  instantiate takes itself out of the session, named in the log, and the
  session carries on without it.

## Teardown

Leaving a session unloads every component and clears everything
session-scoped: the archetype registry, the entity id index, the signal buses
and their counters, the published declarations, the sound quota. A mod holds no
state across sessions — `init` runs again on a clean slate, and anything worth
keeping must live outside the mod.

## The tick

`on_tick(ctx, dt)` runs on a fixed cadence, not per rendered frame — a
dedicated server draws nothing. `dt` is seconds since the previous call, and
`ctx.raised_at` is the tick number. The host does not wait for a slow handler:
a mod still busy when the next tick lands keeps only the newest. Accumulate
`dt`; never count ticks. The exact queue depths and shedding rules are on
[Limits and pacing](/modding/limits/).
