---
title: "Glossary"
description: "Every word Ironlark uses that you cannot guess, one or two sentences each."
sidebar:
  order: 20
---

If a page uses a word you do not know, it is here. Each entry links to the page that
covers it properly.

## Archetype

A thing a mod publishes that can exist in the world — a prop, a zone, a pressable
pedestal. Declared in `mod.toml` as a glTF scene or a host-built shape — see
[Archetypes](/modding/mod/archetypes/).

## Body

An entity a player is currently driving. It is not a type: control is something an
entity gains and loses — see [Entities](/modding/world/entities/).

## Bus

One lane of the mixer, and one volume a listener controls: `effects`, `environment`,
`music`, `interface`. Voice is the host's own lane — a mod cannot play on it, so it is
not in the set — see [Sound](/modding/presentation/sound/).

## Component

A named piece of state on an entity, read and written through two generic verbs over a
whitelist. See [Components](/modding/world/components/).

## Content id

How a mod and everything it publishes is addressed: `author:mod`, as in
`ironlark:freeroam`, and `/` steps down into a declared name —
`you:doors/archetype/oak`, where the kind is one of signal, archetype, request, hook,
sound or entity. Every part of the mod id comes from the install path — see
[Identity](/modding/mod/identity/).

## Entity

Everything in the world is one. Mods create, find and change entities; see
[Entities](/modding/world/entities/).

## Gamemode

An ordinary mod that the server designates as the session's baseline rule layer.
Exactly one runs per session, and the engine has no gamemode concept beyond that one
slot — see [Configuration](/server/configuration/).

## Grant

A server owner's line in `config/server.toml` letting one mod read, write or remove
entities another mod spawned. Cleanup and moderation mods need one; nothing else does,
and no grant reaches a player's body — see [Grants](/server/grants/).

## Handle

An opaque reference to one entity, issued by the host and impossible to forge — spent
when you despawn the entity, and gone when your mod reloads. To reach the same entity
later, give it an id with `set-id` and fetch it with `by-id` — see
[Entities](/modding/world/entities/).

## Hook

A function a mod's half is called on. An engine hook is one the host fires — the tick,
a join — and an author hook is one the mod names itself, reached through the input
bindings it declares; see [Declarations](/modding/mod/declarations/) and
[Input](/modding/presentation/input/).

## Host

The player running the session. Everything authoritative happens there, and today it
is a player rather than a dedicated machine — see [Run a server](/start/run-a-server/).

## Label

A mod-written annotation on an entity: one line of text that answers for the thing it
is attached to. It states a fact about the entity, and how it renders is the host's —
see [Components](/modding/world/components/).

## Listen server

A session hosted by somebody who is also playing in it. It is the only kind Ironlark
has today; see [Running a server](/server/).

## Map

A world, authored as glTF plus a small manifest, shipped by a mod filling the map
role. Data the host owns, not code — see [Maps](/modding/maps/).

## Mod

The one unit of content: identity, versioning, enabling, dependency and teardown all
happen at the mod, addressed `author:mod`. It can carry a server half, a client half,
content, or any mix — see [Identity](/modding/mod/identity/).

## Name

What other players see you called. It belongs to your account and the server states it
— you never type it in when joining, and a mod reads it from the session roster; see
[Reference](/reference/).

## Needs

A mod's `[needs]` table: the mods it must run with, each with the version range it
works with. The host pulls them in and derives the load order — see
[Dependencies](/modding/mod/dependencies/).

## Owner

The mod that spawned an entity. It is recorded by the host, not claimed by the mod,
and it is what every verb checks before touching that entity — see
[Ownership](/modding/world/ownership/).

## Pack

A mod that is only pins: `kind = "pack"` and exact-version needs, a suite an author
ships and tests together. It declares nothing of its own — see
[Dependencies](/modding/mod/dependencies/).

## Part

One node inside a spawned scene, addressed by its path from the root — `"cap"`, or
`"arm/hand"`. Only nodes the model author named are reachable — see
[Entities](/modding/world/entities/).

## Profile id

A server-local persona, unique within its server and opaque to the platform. Personas
are not built: the read is callable today and answers none for everyone — see
[The boundary today](/boundary/).

## Protocol schema

The `protocol.proto` beside a mod's manifest: its signals and requests, declared as
options on the payload types themselves. See
[Protocol schema](/modding/mod/protocol-schema/).

## Realm

Which side a piece of a mod runs on: the authoritative server, or a player's client.
The two have different powers — see [Lifecycle](/modding/lifecycle/).

## Request

One awaited ask from a mod's client half, answered by the server half that declared it
as an `rpc` in its protocol schema. See [Requests](/modding/messaging/requests/).

## Session id

The number a participant is addressed by for the life of one session, present for
everyone connected including bots. Never reused within its session, and never a save
key — see [Lifecycle](/modding/lifecycle/).

## Signal

A byte payload one mod raises on a declared name, heard by every subscriber including
the raiser. Signals are facts, not commands: nobody can consume or override one — see
[Signals](/modding/messaging/signals/).

## Sound

A short audio file a mod ships and declares, played through a bus. One declaration
covers a click and a longer piece; where the bytes live while it plays is the engine's
business — see [Sound](/modding/presentation/sound/).

## User id

The id of an account. It is also the thing a session is addressed by: you join a host
by its user id rather than by an IP address, because there is no address to type —
see [Run a server](/start/run-a-server/).

## Workshop

The directory installed content lives in, `workshop/<author>/<mod>/`. The two levels
are the identity: a mod is named by where the installer put it, never by anything it
writes about itself — see [Identity](/modding/mod/identity/).
