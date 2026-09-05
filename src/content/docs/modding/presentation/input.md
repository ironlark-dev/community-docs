---
title: Input hooks
description: A function of your mod's own that a player's key press reaches — declared with default bindings in the manifest, rebindable by the player, and never shown a keycode.
kind: how-to
area: modding
sidebar:
  order: 40
---

An input hook is a function your mod names, that the player reaches by
pressing something. You suggest the controls; the host owns the binding table;
the player rebinds whatever they like. Your handler is told that its hook
fired and which edge of the press this is — which physical control fired never
reaches the mod.

The shipped `ironlark:echo` mod is the live end-to-end example: press its key
in a session and a counter on the overlay advances. Its declaration and its
handler, both real, anchor this page.

## Declare the hook

```toml
# mod.toml
[declares.client]
hooks = [
    { name = "echo", default-bindings = ["key:f"] },
]
```

Engine hooks (`on_join`, `on_tick`, …) are bare names in the `hooks` list; a
hook of your own is an object, because it has to state what invokes it. Input
is that rule, and `default-bindings` states it:

- **A list of controls** — `["key:f5", "pad:north"]` suggests one per device.
- **An empty list** is legal: a hook waiting until a player binds it.
- **The key absent altogether** is refused when the session starts — a hook
  with no rule is one nothing could ever invoke.

The name is the handler's own Rust name — lowercase letters, digits and `_`,
starting with a letter — because that is what dispatch is keyed by. A name
that shadows an engine hook is refused, and so is the same name declared
twice.

Only a client half can declare one. Input happens on the machine a person is
sitting at; a server half declaring `default-bindings` is refused at session
start. What a server half learns about a press is whatever the client half
chooses to ask it — see [requests](/modding/messaging/requests/).

## Write the handler

The [`#[ironlark::hooks]`](/modding/mod/declarations/) attribute on the impl
block lifts your function out beside the engine hooks. A declared hook with no
function fails the build, and so does a function the manifest never declared —
the attribute exists to end exactly that drift.

```rust
// echo's client half, as shipped.
mod protocol {
    ironlark::protocol!("../protocol.proto");
}

use ironlark::client::prelude::*;
use protocol::{AdvanceRequest, Value};

struct Echo;

#[ironlark::hooks("../mod.toml")]
impl ClientMod for Echo {
    async fn init() {
        ui::set_overlay_text("echo: ?");
        Value::observe(on_value);
    }

    /// The mod's own hook. `mod.toml` binds it to a key by default and the
    /// player rebinds it; the host owns the binding table.
    async fn echo(_ctx: Context, edge: InputEdge) {
        if edge != InputEdge::Pressed {
            return;
        }
        match request(&AdvanceRequest { amount: 1 }).await {
            Ok(_) => log::debug!("echo client: the server answered"),
            Err(e) => log::warn!("echo client: the advance failed: {e}"),
        }
    }
}

async fn on_value(_ctx: Context, _from: SourceId, stated: Value) {
    ui::set_overlay_text(&format!("echo: {}", stated.value));
}

ironlark::export_client!(Echo);
```

**Both edges arrive.** `InputEdge::Pressed` is the key going down,
`InputEdge::Released` the same press finishing — a release is never a second
instruction. Most handlers want one edge and return early on the other, as
`echo` does; a hook that asks the server a question returns on `Released` so
holding the key costs one round trip rather than two. The tick an edge belongs
to is `ctx.raised_at`, the same clock every other event carries.

## The binding vocabulary

A binding is spelled `device:control`. The device word says which table the
control is looked up in — `key:left` is the left arrow while `mouse:left` is
the left button, and the device word is why nothing has to guess. Three
devices exist, and the control vocabulary is closed and host-owned: naming a
control the host does not serve refuses the manifest, naming the control that
is missing.

| Device | Controls |
|---|---|
| `key:` | `a` through `z`, `0` through `9`, `f1` through `f12`, `escape`, `space`, `enter`, `tab`, `backspace`, `delete`, `up`, `down`, `left`, `right`, `shift-left`, `shift-right`, `ctrl-left`, `ctrl-right`, `alt-left`, `alt-right` |
| `pad:` | `south`, `east`, `north`, `west`, `left-bumper`, `right-bumper`, `left-trigger`, `right-trigger`, `left-thumb`, `right-thumb`, `select`, `start`, `dpad-up`, `dpad-down`, `dpad-left`, `dpad-right` |
| `mouse:` | `left`, `right`, `middle` |

Pad controls use the standard layout's words: a face button is where it sits,
not what one vendor prints on it. The mouse wheel is not a button — it arrives
as its own axis when a rule kind for axes lands, which is
[boundary](/boundary/) territory today, as is any rule other than input (a
timer, a player command).

## Who overrides whom

- **The player rebinds.** The defaults you declare are suggestions; the host's
  binding table is theirs to edit, and your mod never knows the difference —
  the handler receives edges either way.
- **The operator can switch a hook off.** A session's configuration can
  disable any hook of any mod by name, your input hooks included:

```toml
# server configuration
[mods."ironlark:echo"]
disabled-hooks = ["echo"]
```

A disabled hook simply never fires; the mod stays loaded. The operator's side
of this is on [mod settings](/server/mod-settings/).

So write the handler as an offer, like a [sound](/modding/presentation/sound/)
is an offer: the mod must stay coherent when its key is rebound to something
awkward, disabled by the operator, or never pressed at all.
