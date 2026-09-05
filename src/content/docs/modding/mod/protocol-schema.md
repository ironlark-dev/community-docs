---
title: "The protocol schema"
description: "protocol.proto declares a mod's signals and requests on the payload types themselves, and other mods import it by install path to borrow a name with its type."
kind: reference
area: modding
sidebar:
  label: "protocol.proto"
  order: 40
---

What a mod announces and what it answers is declared in `protocol.proto`,
beside [the manifest](/modding/mod/manifest/). The declaration sits **on the
payload type itself**, as protobuf options — so a name, its payload and who
hears it are one definition that cannot drift apart, and both halves of the
mod compile against the same file.

A complete real schema — the bundled `ironlark:echo`, one signal and one
request:

```proto
syntax = "proto3";
package mods.ironlark_echo;
import "ironlark/options.proto";

// The authoritative value, as the server states it. It crosses to every client
// half, and it is also what the advance answers with.
message Value {
  option (ironlark.signal) = CLIENTS;
  uint32 value = 1;
}

// The service name says which half answers: the value lives on the server.
service Server {
  rpc Advance(AdvanceRequest) returns (Value);
}

// A client's ask. The server decides what the value becomes.
message AdvanceRequest {
  uint32 amount = 1;
}
```

## The package

`package mods.<author>_<mod>;` — the mod's own
[id](/modding/mod/identity/) with `:` as `_`, and a `-` in a name becomes `_`
too. Every mod's package sits flat under `mods.`, which is what keeps a schema
from shadowing the platform's own `ironlark` package. The host verifies the
package against the install path, so a schema cannot claim another mod's
names.

`import "ironlark/options.proto"` brings in the declaration options; the SDK
ships that file.

## Signals: a message with an audience

A message carrying `option (ironlark.signal)` declares a signal named after
the message (`Value` declares `value`; `SwapLivery` would declare
`swap-livery`). The value says who hears a raise:

| Audience | Where a raise lands |
|---|---|
| `SERVER_MODS` | stays on the server realm's bus — mod-to-mod on the host |
| `CLIENT_MODS` | stays on this machine's client bus — client-half to client-half |
| `CLIENTS` | crosses the network to every client realm |

A message with no option declares nothing — it is a plain payload type, like
`AdvanceRequest` above or the `PlayerAt` row inside `freeroam`'s positions
fact. How raising and subscribing work in code is
[Signals](/modding/messaging/signals/).

## Requests: an rpc in `service Server`

An `rpc` inside `service Server` declares a request named after the rpc
(`Advance` declares `advance`), answered by the mod's server half. The service
name is the declaration of which half answers; client-to-server is the
direction served, so a request in a `service Client` is refused. See
[Requests](/modding/messaging/requests/).

## Transit options

Beside the audience, a signal may declare how the host carries it:

```proto
option (ironlark.transit.keep) = NEWEST;
```

| Option | Values | Meaning |
|---|---|---|
| `ironlark.transit.keep` | `KEEP_ALL` (default), `NEWEST` | What the host retains under pressure. `NEWEST` says a newer raise supersedes an older one — the right shape for a restated fact like positions, where loss is inside the word. |
| `ironlark.transit.order` | `IN_ORDER` (default), `ANY` | Whether raises of one name arrive in raise order. `ANY` is declared but not yet served: the host refuses it at load. |

The defaults are never written; a schema states only what departs from them.

## The compiled schema: `protocol.pb`

The host does not parse `.proto` text. What ships beside the manifest is
`protocol.pb` — the compiled descriptor set of `protocol.proto` with its
imports — and the host reads every declaration out of it the same way it reads
`mod.toml`: without executing any code. The bundled mods' build emits it from
the source schema and refuses a compiled copy the source has outgrown, so the
two cannot drift silently.

## Borrowing another mod's schema

A payload has one definition: its owner's. A mod that reads another's signal
imports the owner's schema **by the owner's install path**, and compiles
against the owner's own types — a change to the payload is then a compile
error in the borrower, never a wrong value at runtime.

The bundled `watchman` reads `freeroam`'s positions fact. Its whole schema:

```proto
// This mod declares no name of its own. It reads freeroam's positions fact, so
// freeroam's schema is imported by its install path and the payload type is
// freeroam's own definition rather than a copy of it.
syntax = "proto3";
package mods.ironlark_watchman;
import "ironlark/freeroam/protocol.proto";
```

And `freeroam` itself, a gamemode wired to several mods, opens with:

```proto
syntax = "proto3";
package mods.ironlark_freeroam;
import "ironlark/options.proto";
import "ironlark/buttons/protocol.proto";
import "ironlark/teleport/protocol.proto";
import "ironlark/balloons/protocol.proto";
```

The import path is `<author>/<mod>/protocol.proto` — the directory layout
under the workshop, which is [the identity](/modding/mod/identity/) in its
filesystem spelling.

## In Rust

One line generates the types, with the registration surface on each:

```rust
mod protocol {
    ironlark::protocol!("../protocol.proto");
}
```

A declared signal's type carries `observe` (subscribe a handler) and is what
`signal(&Value { value })` takes; a declared request's payload carries
`respond` on the server side and is what the client's `request(...)` takes. A
borrowed type appears under the owner's module — `watchman` reads
`protocol::ironlark_freeroam::PlayerPositions`. A message or rpc the schema
does not declare cannot be raised or asked at all: the name simply does not
exist as a type.
