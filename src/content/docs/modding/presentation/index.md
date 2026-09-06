---
title: Presentation
description: What the player sees, hears and presses — the four surfaces a mod reaches a person through, and which realm serves each one.
kind: explanation
area: modding
sidebar:
  order: 0
  label: "Reaching the player"
---

Everything on this page is about the moment a mod meets a person: a sound in
their ears, a line on their screen, text over a body in the world, a key under
their finger. Each surface is small on purpose. The host owns the screen, the
speakers and the input table; a mod states meaning and the host presents it.

If this is your first visit, [write a first mod](/modding/first-mod/) before
reading on — every page here assumes a mod with a manifest and at least one
half, as [realms and lifecycle](/modding/lifecycle/) lays them out.

## The four surfaces

| Surface | Written from | Who gets it |
|---|---|---|
| [Sound](/modding/presentation/sound/) | either half | the server half reaches every participant; the client half reaches this machine alone |
| [The overlay line](/modding/presentation/overlay/) | client half | this machine's screen |
| [Body decoration](/modding/presentation/body-decoration/) | server half | everyone who can see the body |
| [Input](/modding/presentation/input/) | client half | the player's press reaches the mod — the one surface that runs toward you |

The realm split is not an implementation detail; it is the meaning. A screen
and a keyboard belong to one machine, so the overlay and input live in the
client half. A sound everyone must hear and a label everyone must see are
session facts, so they are stated where session facts are stated. A server
half that wants one particular player to see or hear something sends to that
player with [`signal_to`](/modding/messaging/signals/) and lets their client
half do the presenting.

## What every surface has in common

- **Declared, then used.** A sound and a decoration row are lines in
  [`mod.toml`](/modding/mod/manifest/); an input hook is declared beside them.
  Nothing on these pages works without its declaration.
- **The host presents, the mod states.** There is no widget library, no font
  call, no mixer handle. A mod hands over one line, one sound name, one label
  text — placement, styling and mixing belong to the host and the player.
- **The player outranks the mod.** A player can mute a mod's audio, rebind its
  keys, or walk out of a label's range. None of that is reported back, and a
  well-made mod keeps working when it happens.
- **Counted.** Sound carries a per-mod allowance, an overlay is one line, a
  decoration row has one holder per session. The wider budget rules are on
  [limits](/modding/limits/).

## Where the rest lives

Maps — the world the player stands in — are content rather than presentation,
and have [their own section](/modding/maps/). Entity liveries and other world
state a mod writes are [components](/modding/world/components/). The dry
signatures behind these pages are in the reference:
[`audio`](/reference/audio/) and [`ui`](/reference/ui/).
