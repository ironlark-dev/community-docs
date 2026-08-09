---
title: "Realms and the session lifecycle"
description: "A mod has up to two halves that run in different places with different powers, and both are loaded and torn down per session rather than per process."
sidebar:
  label: "Realms and lifecycle"
  order: 10
---

## Two realms

A mod ships one or two WebAssembly components. They are separate worlds with separate
imports, and the host loads them in different places.

| | `<name>_server.wasm` | `<name>_client.wasm` |
|---|---|---|
| Runs on | the host only | every peer, including the host |
| Authority | decides what is true | presents what it is told |
| May import | `log`, `broadcast`, `entity`, `gamemode`, `map-api`, `signal`, `spatial` | `log`, `ui`, `rpc-out` |
| Must export | `server-api` | `client-api` |

The split is not a suggestion: the client half physically cannot spawn an entity or move
anything, because `entity` is not among its imports. Anything authoritative — placement,
scoring, who is "it" — lives in the server half, and reaches players as messages.

A mod may ship only a server half. Most do. You need a client half only to put something on
a player's screen or to react to a key.

## Both halves must export everything

The host calls every function in the exported interface, so a component that omits one does
not instantiate — and a mod that fails to instantiate takes the whole session's mod loading
with it: nothing spawns, and the log carries one warning.

`server-api` has eight: `init`, `on-player-join`, `on-player-leave`, `update`, `on-interact`,
`on-signal`, `on-contact`, `handle-rpc`.

`client-api` has three: `init`, `on-message`, `on-input`.

Most of those are empty in most mods. Write the stubs anyway — copy them from a reference
mod. There is no "optional export".

## The session lifecycle

Content is decided when a **session** starts, not when the process starts. Install an addon
while sitting in the menu and the next session picks it up; no relaunch.

Entering a session runs this chain, in order, each step reading the one before:

1. **discover** — walk the content root, find every addon and every mod inside it
2. **settle what runs** — the host resolves its configured set; a joining peer adopts the
   host's set instead and refuses to join if it is missing any of it
3. **build the registry** — index the archetypes of *enabled* mods only, so a disabled
   addon's scenes never reach the asset loader
4. **load server mods** — host only
5. **load client mods** — everywhere
6. each loaded component's `init` runs

Leaving a session unloads every component, drops the registry, and clears the id index and
the signal bus. A mod holds no state across sessions: `init` runs again on a clean slate.

Two consequences worth internalising:

- **`init` is early.** Colliders and scene children may not exist yet. Work that needs the
  world to be ready belongs in `update`, retried until it succeeds — that is how the
  `watchman` reference mod places itself.
- **A mod that fails to load blocks joins.** The host defers player joins until every server
  mod reports loaded, so one broken component means nobody gets a body.

## The tick

`update(dt)` runs on a fixed cadence, not per rendered frame — a headless server draws
nothing. `dt` is seconds since the previous call, so scale motion by it.

**Ticks can be dropped.** The host does not wait for `update`: a mod still busy from last
time is skipped, and a full command queue drops the call. Never count ticks to measure time;
accumulate `dt`.
