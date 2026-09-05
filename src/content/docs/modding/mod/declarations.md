---
title: "Declarations"
description: "The six kinds of name a mod publishes, which file declares each one, how each is addressed, and how another mod borrows one."
kind: reference
area: modding
sidebar:
  order: 30
---

A declaration is a name a mod claims under
[its own id](/modding/mod/identity/). The host qualifies it, checks it where
it is used, and refuses an undeclared name at `init` — never mid-session as a
handler that quietly does nothing. There are exactly six kinds.

## The six kinds

| Kind | What it is | Declared in | Addressed as |
|---|---|---|---|
| `signal` | an announcement to whoever subscribed | `protocol.proto`: a message carrying `option (ironlark.signal)` | `author:mod/signal/<name>` |
| `request` | an awaited ask, answered by the mod's server half | `protocol.proto`: an `rpc` inside `service Server` | `author:mod/request/<name>` |
| `archetype` | a recipe for an entity — a scene or a shape, plus flags | `mod.toml`: `[[declares.archetype]]` | `author:mod/archetype/<id>` |
| `hook` | an input entry point of the mod's own, bindable by the player | `mod.toml`: an object in `[declares.client]` `hooks` | `author:mod/hook/<name>` |
| `sound` | a shipped audio file | `mod.toml`: `sounds = [...]`, the file beside it | `author:mod/sound/<name>` |
| `entity` | one live instance in the world | never declared — given at runtime with `set_id` | `author:mod/entity/<id>` |

Two files split the work by what a name carries. A name with a **payload
type** — a signal, a request — lives in
[the protocol schema](/modding/mod/protocol-schema/), where the type is
defined; the declaration sits on the payload type itself. A name that is
**data the manifest holds everything about** — an archetype's flags, a sound's
file, a hook's bindings — lives in
[the manifest](/modding/mod/manifest/).

`entity` is the exception both ways: instances are minted at runtime in
numbers no file could list, so nothing declares them, and the id is free-form
within the owning mod — the bundled `ironlark:freeroam` stamps each player's
body `player/<session>`, and a `/` in the id is how a family is scanned
(`find` with a prefix). It is the only kind whose name the owner invents live.

A schema name is written `CamelCase` and declared in its manifest spelling:
the message `Pressed` declares the signal `pressed`, and `SwapLivery` would
declare `swap-livery`. Manifest names are already in that spelling —
lowercase, digits and hyphens. Hook names are code identifiers instead
(underscores, no hyphens), because each one is the handler's own name.

## Your own names are bare; the host writes the id

A mod never writes its own full id. Your code says `pressed`, `button`,
`press` — and the host, knowing who is calling, makes that
`<your id>/signal/pressed` and so on. A fork of your mod automatically
publishes under its own directory instead of yours, without editing a line.

With the Rust SDK the names are not even strings: `ironlark::protocol!` turns
each schema declaration into a type carrying its own registration
(`Pressed::observe(...)`, `Advance::respond(...)`), and
`ironlark::declares!("../mod.toml")` mints one item per declared sound and
archetype (`protocol::sound::Press`, `protocol::archetype::Button`), so a name
the manifest does not carry cannot be spelled at all.

## Borrowing another mod's name

A name that carries a `:` names something the caller does not own and is taken
exactly as written — the one place a full id appears in a mod's source:

- **An archetype**: spawn `"ironlark:buttons/archetype/button"` as the string
  it is. What you spawn is yours to move and remove; its interact and contact
  events still go to the declaring mod. See
  [Ownership](/modding/world/ownership/).
- **A sound**: resolve `"ironlark:buttons/sound/press"` to an id, then play
  it. See [Sound](/modding/presentation/sound/).
- **A signal or request**: the name resolves the same way, but the payload
  needs its type too — so a borrower imports the owner's `protocol.proto` by
  its install path and compiles against the owner's own definition, never a
  copy. The bundled `watchman` borrows `freeroam`'s positions fact exactly
  this way; [The protocol schema](/modding/mod/protocol-schema/) shows the
  real lines.
- **An entity**: never. Instance ids are scoped to the mod that set them;
  another mod's instances are reached through what the world reports —
  [spatial queries](/modding/world/spatial/) and
  [contact](/modding/world/contact/) — not by name.

A borrowed name is checked like an owned one: a name nobody enabled declares
is refused where it is used, naming the missing mod — never a handler that
quietly does nothing. The bundled `freeroam` leans on that deliberately, so a
baseline-only install still starts; everyone else states the owner in
[`[needs]`](/modding/mod/dependencies/), which makes the owner's presence and
version something the session enforces before anything loads.
