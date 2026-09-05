---
title: "Requests: asking the authority"
description: "The one awaited ask: the client half sends a declared request, the mod's own server half answers it — and the answer may be a typed no."
kind: explanation
area: modding
sidebar:
  label: "Requests"
  order: 2
---

A request is the one awaited act in the SDK: a mod's client half asks a typed question,
its own server half answers, and the caller waits on the answer. Every act a player
performs that has to be true for everyone crosses here — a purchase, a vote, the press
of a mod's own key. Where a [signal](/modding/messaging/signals/) announces and stops, a
request is addressed and answered, and the answer may be **no**.

## Declared as a service, in protocol.proto

A request is a native `service` block in the mod's
[protocol schema](/modding/mod/protocol-schema/). This is the bundled echo mod's file,
whole — one value, one ask to advance it:

```proto
syntax = "proto3";
package mods.ironlark_echo;
import "ironlark/options.proto";

// The authoritative value, as the server states it. It crosses to every
// client half, and it is also what the advance answers with.
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

The service's name says which half answers, and `service Server` is the direction
served — `service Client` is refused where it is written, in the schema. `rpc Advance`
declares the name `advance`. One name, two types: the request type is what the caller
hands over, and the return type is the answer. The answer may be any message the schema
defines — reusing one that also declares a signal, as `Value` does here, is the intended
thing rather than minting a near-copy.

Both halves compile against this one file through
`ironlark::protocol!("../protocol.proto")`, so the types at both ends are one type.

## Asking, from the client half

`request(&value).await` — the request type carries the declaration, so nothing names it
at the call site, and the answer comes back typed:

```rust
use ironlark::client::prelude::*;
use protocol::AdvanceRequest;

// An input hook this mod declared in its manifest; the player presses the key
// bound to it. Both edges arrive, so one that acts on the press says so.
async fn echo(_ctx: Context, edge: InputEdge) {
    if edge != InputEdge::Pressed {
        return;
    }
    match request(&AdvanceRequest { amount: 1 }).await {
        Ok(_) => log::debug!("echo client: the server answered"),
        Err(e) => log::warn!("echo client: the advance failed: {e}"),
    }
}
```

Routing takes a request to the mod whose schema declares it, and to no other — two mods
may both ship an `open` and neither answers for the other. The server realm does not
import the asking verb at all: the authority has nobody above it to ask.

## Answering, in the server half

The handler registers **on the request type**, usually in `init`, and answers the
response type or a `Refusal`:

```rust
use ironlark::server::prelude::*;
use protocol::{AdvanceRequest, Value};

ironlark::state! {
    static VALUE: u32 = 0;
}

struct Echo;

impl ServerMod for Echo {
    async fn init() {
        AdvanceRequest::respond(advance);
    }
}

async fn advance(_ctx: Context, _caller: Player, ask: AdvanceRequest) -> Result<Value, Refusal> {
    let value = VALUE.update(|v| {
        *v = v.wrapping_add(ask.amount);
        *v
    });
    // Every peer hears the new state, not just the caller — see below.
    if let Err(e) = signal(&Value { value }) {
        return Err(Refusal::Unknown {
            message: format!("advanced the value but could not raise it: {e}"),
        });
    }
    Ok(Value { value })
}
```

The handler is given the event, the `Player` whose client half asked — a request arrives
bound to whoever sent it, host-stamped — and the request already decoded. This is the
one handler in a server half with a caller waiting on it, and therefore the one place a
`Result` is an **answer** rather than a report.

Registering later than `init` is legal; a name asked before anything answers it refuses
the caller, the same as a half that never registered. Registering the same request again
replaces the handler, with a debug line saying so.

## Refusal is the answer's no

A handler's no is a typed `Refusal` naming the rule the caller broke, and it rides the
same wire back as a yes: the caller receives it as an error of kind `Refused`, carrying
the handler's own words. The same kind also covers the failures before the handler ever
runs — no enabled mod declares the name, the answering mod is not running or overloaded,
the ask never got out — so match on the kind and log the message, which is the part that
says which of them happened.

A payload that will not decode as the request type is turned into a refusal before the
handler is entered, so a handler never sees a half-parsed value. Payload and answer are
both capped; an ask over the cap is refused where it enters the host, naming the cap,
and never sent to the answering half.

## The echo lesson: act on the raise, not the reply

Look at the two fences above again. The server half **both** answers `Advance` **and**
raises `Value` to `CLIENTS` — and the client half deliberately ignores the value its own
ask returns:

```rust
use ironlark::client::prelude::*;
use protocol::Value;

struct Echo;

impl ClientMod for Echo {
    async fn init() {
        // Deliberately not "0" — the value is unknown until the server says
        // so, and a confident 0 makes a dead round trip look like a live one.
        ui::set_overlay_text("echo: ?");
        Value::observe(on_value);
    }
}

async fn on_value(_ctx: Context, _from: SourceId, stated: Value) {
    ui::set_overlay_text(&format!("echo: {}", stated.value));
}
```

That is not redundancy. The reply reaches **one** machine — the presser's — while the
raise reaches every machine, the presser's included. A client that rendered the reply
would look correct on the presser's own screen even with the crossing to everyone else
completely broken, and only they would be right. So: the reply tells you the ask
succeeded; the raise tells you the world agrees. Render the raise, and treat the reply
as delivery confirmation and a carrier for the no.
