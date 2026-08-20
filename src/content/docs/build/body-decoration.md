---
kind: how-to
area: build
title: "Decorating players: nameplates"
description: "Put text over every player's head from an ordinary addon: declare the label row in your manifest and write it — no event, no grant, no server config."
sidebar:
  label: "Decorating players"
  order: 45
---

A nameplate is a label on a player's body, written without waiting for that
player to touch anything of yours. Body writes are normally event-gated;
**decoration rows** are the exception, and you opt in with one manifest line.

## Declare the row

```toml
[declares]
body-rows = ["label"]
```

That is the whole permission: enabling your addon appoints it, and the server
prints the declaration in its session-start log. `label` is the only
decoration row today; declaring anything else fails the manifest. If two
enabled addons declare the same row, the earlier one in the server's addon
list holds it for the session and the later declaration is refused with a
line naming both.

## Write the row

Names come from the session roster; the body appears a moment after the join
reaches your mod, so keep a retry list and write from `update`:

```rust
async fn write_nameplate(player: &str) -> bool {
    let Some(name) = get_all(player.to_string())
        .await
        .into_iter()
        .find(|(key, _)| key == "name")
        .map(|(_, value)| value)
    else {
        return false; // roster row not there yet - retry next tick
    };
    let Ok(body) = body_of(player.to_string()).await else {
        return false; // body not spawned yet - retry next tick
    };
    let label = ComponentField {
        path: "text".into(),
        value: FieldValue::Text(name),
    };
    set_component(&body, "label".into(), vec![label]).await.is_ok()
}
```

The first write attaches the row with its defaults — a readable offset above
the head, a 30 m range — and the row then answers to your mod: nobody else
rewrites your text, though any mod with reach may reset it to blank.
Re-writing the same name on a short interval heals a reset for free: a write
that restates the held value is dropped before it touches anything.

The shipped `ironlark:core:nameplates` mod is exactly this pattern, complete
with the retry and re-assert bookkeeping.

## What decoration can never do

A decoration row is a statement observers see about a player — never a
channel out of them or a hand on them. Whatever you declare: no reads, no
pose, no possession, no despawn. Those stay behind the
[event gate](/build/entity-ownership/), permanently.

Disabling your addon erases every row it held, on every peer. A player who
leaves takes their nameplate with them; a body released from its player is
wiped clean.
