---
title: The overlay line
description: One line of text on this player's screen, written from the client half with set_overlay_text — replaced whole, cleared by the empty string, cut at 128 characters, painted in a panel the host owns.
kind: how-to
area: modding
sidebar:
  order: 20
---

The overlay is the host's own panel painted over the running game, and every
client half gets exactly one line of it. Writing that line is one call, with
no declaration in [`mod.toml`](/modding/mod/manifest/) at all:

```rust
// ClientMod and the `ui` module both arrive with this one import.
use ironlark::client::prelude::*;

struct Door;

impl ClientMod for Door {
    async fn init() {
        // This mod's whole line. No other mod's line is touched.
        show(false);
    }
}

fn show(open: bool) {
    ui::set_overlay_text(if open { "door: open" } else { "door: shut" });
}
```

That is the whole surface. `ui::set_overlay_text` returns nothing and cannot
refuse: the text is handed to the host's frame loop, and there is nothing to
wait for.

The shipped `ironlark:echo` mod uses its line the way most mods will — a
value restated whole each time the server states a new one. Its real handler:

```rust
// echo, client half — the handler its init subscribed with Value::observe.
async fn on_value(_ctx: Context, _from: SourceId, stated: Value) {
    ui::set_overlay_text(&format!("echo: {}", stated.value));
}
```

Echo's init writes `"echo: ?"` first — deliberately not `"0"`, because the
value is unknown until the server says so, and a confident zero makes a dead
round trip look like a live one.

## One line, yours

The host keeps one line per client half, keyed by the mod that wrote it, and
paints them all in one panel, joined in mod-id order. The rules that fall out
of that:

- **A write replaces only your line.** Two mods that have never heard of each
  other cannot erase one another, and where your line sits does not depend on
  who wrote first.
- **The empty string clears it.** `ui::set_overlay_text("")` drops your line
  out of the panel altogether — and so does your client half going away.
- **You rewrite it whole.** Nothing appends and nothing edits part of a line,
  so a mod showing a changing value restates the whole sentence each time, as
  `on_value` above does.
- **Text past 128 characters is cut.** Counted in characters rather than
  bytes, so the cut cannot split a code point — and the caller is not told.

## The panel belongs to the host

There is no styling, no layout, no placement a mod chooses, no second line
and no region. The host owns the screen; a mod states one line of meaning.
A richer mod-drawn surface does not exist yet — that is recorded on
[the boundary](/boundary/).

## Client realm only

An overlay is one machine's screen, so the call lives in the client half —
see [realms and lifecycle](/modding/lifecycle/) for the split. A server half
that wants every player told something raises a
[signal](/modding/messaging/signals/) and lets each client half write its own
line from what arrives; one particular player is reached the same way with
`signal_to`. The echo mod above is the shipped, working example of exactly
that crossing.

For text placed in the world rather than on the screen — a label over a
player's head that everyone sees — use
[body decoration](/modding/presentation/body-decoration/) instead.

The dry signature is in the [`ui` reference](/reference/ui/).
