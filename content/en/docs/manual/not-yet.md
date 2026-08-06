---
title: "What you cannot build yet"
linkTitle: "What you cannot build yet"
weight: 100
description: >
  The honest boundary of the mod surface. Read this before designing, not after.
---

Every limit below is a limit of the engine as it stands, not of your approach. Each one is
cheap to hit and expensive to discover halfway through a build.

## No shooting, and no hitting a player with a ray

`spatial::raycast` deliberately **excludes character bodies**. Rays see map geometry and the
collision proxies of archetypes flagged `interact` or `contact` — nothing else. There is
also no health anywhere in the engine.

So: no hitscan weapons, no melee that resolves against a player, no deathmatch. What *does*
work is a ray toward a player's **position**, which tells you whether the map occludes them —
enough for line-of-sight, hide-and-seek and vision cones. The `watchman` reference mod is
built on exactly that.

## Proximity, not player-to-player touch

Contact events fire for archetypes you flagged, and `on-contact` tells you when a **player**
touched one of them. There is no player-to-player contact event, because neither party is a
flagged entity.

Tag games are still easy: compare body positions each tick. Distance is a subtraction, and
`get-component` on `transform` gives you the numbers.

## One input action, and it is a debug key

There is no input system for mods. Exactly one action reaches client mods — the name `echo`,
sent when **F** is pressed — and every client mod sees it. You cannot bind a key, name an
action, or read movement input.

Design around it: use trigger volumes for "do a thing here" and interact (**E**) for "use
this object", both of which are real mechanisms.

## Elimination has no spectator

You cannot despawn your own body, and there is exactly one camera which is a child of the
body — so a player without a body sees black rather than the world.

"Eliminated" therefore has to mean *moved*: teleport them to a pen, a balcony, a jail. In
practice that plays better anyway, because they can watch and heckle.

## UI is one line of text

The whole client-side presentation surface is `ui::set-overlay-text`. No panels, no images,
no layout, no input widgets. A scoreboard is a formatted string.

## No items, no attachments

There is no inventory, no held item, and no way to attach one entity to another. A "carried"
object can only be faked by moving it to follow its owner each tick.

## No persistence, no sound

Nothing a mod writes survives the session; there is no save API. There is no audio API at
all.

## Cross-mod reach is bytes only

You cannot get a handle to another mod's entity — `find` is scoped to your own, and a ray
that hits a foreign entity reports the geometry without a handle. Mods cooperate by
exchanging byte payloads over [signals](../signals/). That is a deliberate boundary, not a
gap: a handle is permission to mutate.

## What this leaves, concretely

Plenty, and more than it sounds: race and parkour courses, king-of-the-hill, tag and
infection, hide-and-seek with real occlusion, red-light/green-light, floor-is-lava, puzzle
rooms, trigger-driven traps, anything built from moving props and per-player text.

The common shape is: *watch positions, move things, recolour things, tell people what
happened.*
