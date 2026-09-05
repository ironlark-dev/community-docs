---
title: "Signals: announcing facts"
description: "Declare a payload type once in protocol.proto, raise it with signal(), hear it with observe() on the type — and let the audience say where it lands."
kind: explanation
area: modding
sidebar:
  label: "Signals"
  order: 1
---

A signal is a **fact that already happened**, raised to whoever observed its name. There
is no addressee, no consuming it, no vetoing it, no reply, and no defined order between
two different observers. If you find yourself wanting to *decide* something with one —
approve a press, block a spawn — that is a different mechanism the engine does not have
yet ([the boundary](/boundary/)). For the one ask that awaits an answer, use a
[request](/modding/messaging/requests/).

## Declared on the message, in protocol.proto

A signal is declared by one option line on a message in the mod's
[protocol schema](/modding/mod/protocol-schema/), the file both halves compile against.
This is the bundled button mod's, whole:

```proto
syntax = "proto3";
package mods.ironlark_buttons;
import "ironlark/options.proto";

message Pressed {
  option (ironlark.signal) = SERVER_MODS;
  string target = 1;
}
```

The option's value is the **audience** — `SERVER_MODS`, `CLIENT_MODS` or `CLIENTS` — and
it is the whole answer to where a raise lands ([the map](/modding/messaging/)). The
declared name is the message name in the manifest charset: `Pressed` declares `pressed`,
`PlayerPositions` declares `player-positions`. A message carrying no option declares
nothing and is a plain helper type.

`ironlark::protocol!("../protocol.proto")` compiles the file while the crate compiles
and generates the payload types, each carrying its declaration — so a name is never
spelled as a string, and a payload that declares nothing is a compile error at the verb
rather than a handler that silently never fires.

## Raising

One typed value, one call. The server half raises with `signal`; the payload carries the
declaration, so nothing at the call site says where it goes:

```rust
use ironlark::server::prelude::*;
use protocol::Pressed;

// Inside the button's on_interact handler, after acting on the press: announce
// the fact. Who reacts is not this mod's business, and the raise awaits
// nothing.
fn announce(id: String) {
    if let Err(e) = signal(&Pressed { target: id }) {
        log::error!("buttons: the press did not go out: {e}");
    }
}
```

A client half has the same verb for its own machine: `signal` in the client prelude
raises on that machine's client bus, and the compiler admits only a `CLIENT_MODS`
payload there — crossing the network is the authority's act, and a client half cannot
spell it.

`Ok` means the host took it, never that anybody acted on it — a name nobody observes is
inert, and the raiser cannot tell. A raise from `init` is legal and normal: until every
half has loaded, the bus holds raises and then delivers them in order.

## Observing

The receiving end registers **on the payload type**, in either realm:

```rust
use ironlark::server::prelude::*;
use protocol::Pressed;

struct Gamemode;

impl ServerMod for Gamemode {
    async fn init() {
        Pressed::observe(on_pressed);
    }
}

async fn on_pressed(_ctx: Context, source: SourceId, fact: Pressed) {
    log::info!("a press on {} was announced by {source:?}", fact.target);
}
```

`init` is the usual place and not the only legal one — registering is legal at any
moment the mod is running, so a half that starts listening once a round begins is
written the way it reads. Registering the same signal again **replaces** the handler,
with a debug line saying so. Subscriptions die with the mod, and there is no replay: a
late observer misses history, which is why the joiner shape below exists.

## The source is host-stamped

Every delivery carries the raiser's `SourceId`, stamped by the host — a mod cannot forge
it. So "obey only the gamemode" is one integer compare, against an id resolved once:

```rust
use ironlark::server::prelude::*;
use protocol::Pressed;

ironlark::state! {
    static GAMEMODE: Option<SourceId> = None;
}

// In init: resolve the mod id once. An id is minted per session, so it is
// resolved rather than hard-coded.
fn learn_the_gamemode() {
    match resolve::source("ironlark:freeroam") {
        Ok(id) => GAMEMODE.set(Some(id)),
        Err(e) => log::warn!("freeroam is not enabled this session: {e}"),
    }
}

async fn on_pressed(_ctx: Context, source: SourceId, _fact: Pressed) {
    if GAMEMODE.get() != Some(source) {
        return;
    }
    // Only freeroam gets past this line.
}
```

Gating on the source is policy, not ceremony — the bundled balloon mod obeys its
recolour command from anybody, because the command is harmless, and logs the source
instead. A mod with something to protect checks it.

## Put the data in the payload

A signal does not synchronize with anything else the raiser did. "Hear a signal, then
read the world" is an anti-pattern — the world may not have caught up. Carry everything
the handler needs in the payload, and when the payload is state, **raise the whole
state** rather than a change to it, so an observer that missed a raise is right again
after the next one. The bundled watchman never reads the world after a signal: the
positions fact it observes carries every position.

## CLIENTS is also your own client half

`CLIENTS` is not only for strangers: it is how **one mod's two halves talk**. The server
half raises what is true; the mod's own client half observes the same type — both
compiled from the one `protocol.proto` — and renders it. The bundled scoreboard is the
whole shape:

```rust
// The server half: state WHO IS HERE as one crossing signal. The full list on
// every change, so a client half that arrived late is complete after one raise.
use ironlark::server::prelude::*;
use protocol::Roster;

async fn state_the_roster() {
    let players = session::participants().await;
    let players = players.into_iter().map(u64::from).collect();
    if let Err(e) = signal(&Roster { players }) {
        log::warn!("scoreboard: the roster did not go out: {e}");
    }
}
```

```rust
// The client half: rendering only. Same type, same file, other realm.
use ironlark::client::prelude::*;
use protocol::Roster;

struct Scoreboard;

impl ClientMod for Scoreboard {
    async fn init() {
        // Unknown until the server half says who is present; a confident
        // empty board would make a dead crossing look like an empty session.
        ui::set_overlay_text("players: ?");
        Roster::observe(on_roster);
    }
}

async fn on_roster(_ctx: Context, _from: SourceId, stated: Roster) {
    ui::set_overlay_text(&format!("players: {}", stated.players.len()));
}
```

Every other mod's client half that observed `roster` hears it too — a raise to `CLIENTS`
is never private. That is a feature: one mod states a fact, any overlay may render it.

## `signal_to`: the same raise, one machine

`signal_to(session_id, &payload)` is the identical announcement narrowed to one
participant's machine. Narrowing is per raise — nothing about it is declared — and the
verb accepts only a `CLIENTS` payload: narrowing a raise that never leaves a bus is
meaningless, so it is a compile error rather than a refusal mid-session.

What it is for is the joiner. An arriving client half has missed every raise so far, so
the bundled echo mod answers it alone, at the cost of nobody else:

```rust
use ironlark::server::prelude::*;
use protocol::Value;

ironlark::state! {
    static VALUE: u32 = 0;
}

struct Echo;

impl ServerMod for Echo {
    async fn on_join(_ctx: Context, player: Player) {
        let value = VALUE.get();
        if let Err(e) = signal_to(player.session(), &Value { value }) {
            log::warn!("echo server: stating the value failed: {e}");
        }
    }
}
```

`Ok` here means the host took it for delivery; a session id that names nobody is a
host-side warning the raiser never sees.

## High-rate state: keep = NEWEST

A second option on the message declares how the host carries it under pressure:

```proto
message Positions {
  option (ironlark.signal) = CLIENTS;
  option (ironlark.transit.keep) = NEWEST;
  repeated PlayerAt players = 1;
}

// No option, so no declaration: a helper the fact carries.
message PlayerAt {
  uint64 player = 1;
  float x = 2;
  float y = 3;
  float z = 4;
}
```

`NEWEST` says a newer raise **supersedes** an older one still in flight — the shape of
high-rate state, where a listener wants the current answer rather than every step toward
it. It is served only where the signal crosses the network, so pairing it with a bus
audience is refused by name when the mod loads. A superseding raise rides a path where
one message cannot be split, so its payload cap is the smaller one. Declaring nothing
gets the default: every raise delivered, in raise order, per name.

## Cross-mod: the button, the gamemode and the balloons

Ownership of a name is **not** enforced — existence is. Any enabled mod may raise or
observe a name another mod declared, by importing that mod's schema; what refuses is a
name no enabled mod declares, at first use, naming which schema to check. Borrowed
schemas are imported by the owner's install path, so a payload has one definition:

```proto
package mods.ironlark_freeroam;
import "ironlark/options.proto";
import "ironlark/buttons/protocol.proto";
import "ironlark/balloons/protocol.proto";
```

The bundled mods walk the whole pattern. The button raises its `Pressed` fact and stops
— who cares is not its business. The gamemode is the wiring layer: it observes the fact
and translates it into a command that the balloon mod declared. The balloons obey their
own name. Neither content mod knows the other exists, and no server configuration is
involved:

```rust
// In freeroam, the gamemode: borrowed types arrive under their owner's
// package, so whose name each one is stays visible at the use site.
use ironlark::server::prelude::*;
use protocol::ironlark_balloons::SwapLivery;
use protocol::ironlark_buttons::Pressed;

// In init: Pressed::observe(on_pressed);

async fn on_pressed(_ctx: Context, source: SourceId, _fact: Pressed) {
    log::info!("freeroam: pressed from {source:?} -> swap-livery");
    if let Err(e) = signal(&SwapLivery {}) {
        log::error!("freeroam: swap-livery did not go out: {e}");
    }
}
```

A fork of any of these mods talks on its own names — the host qualifies a declaration by
the mod that owns it, so two authors may both declare a `pressed` and neither hears the
other's.

## What refuses

- **Too large** — a payload over the host's byte cap, refused whole: nothing is
  truncated and nothing goes partly out. The refusal names the cap it measured against
  (a `NEWEST` signal is measured against the smaller one).
- **Unresolved name** — this session does not carry the name, or carries it in the other
  realm; what a mod meets when the declaring mod is not enabled.
- **The host's own trouble** — a full queue, or more raises in one tick than the mod's
  budget. An overloaded raise is a typed refusal, never a silent shed.

Registering `observe` answers nothing: a bad name is an error line at the call, and the
signal is simply never heard. Per delivery, bytes that do not decode as the payload type
are dropped with a warning naming the signal — one raiser's bad payload costs one
delivery and nothing else.
