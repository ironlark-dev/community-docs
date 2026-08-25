---
title: "Glossary"
description: "Every word Ironlark uses that you cannot guess, one or two sentences each."
sidebar:
  order: 20
---

If a page uses a word you do not know, it is here. Each entry links to the page that
covers it properly.

## Addon

The unit you install, share and switch on: a directory holding maps and mods. Its
identity comes from where it is installed, never from anything it writes about itself
— see [Addons and identity](/addons/addons-and-identity/).

## Archetype

A thing a mod publishes that can exist in the world — a prop, a zone, a pressable
pedestal. Declared in `mod.toml` with a model to show for it; see
[Archetypes](/addons/archetypes/).

## Body

An entity a player is currently driving. It is not a type: control is something an
entity gains and loses — see [Entities and control](/build/entities-and-control/).

## Bus

One lane of the mixer, and one volume a listener controls: `effects`, `environment`,
`music`, `interface`, `voice`. You name one every time you play a sound. `voice` is the
host's — see [Playing a sound](/build/playing-sound/).

## Component

A named piece of state on an entity, read and written through two generic verbs over a
whitelist. See [Components](/build/components/).

## Content id

How anything installed is addressed: `author:addon:mod`, as in `ironlark:core:badgrass`
or `you:doors:oak`. Past the mod, `/` steps down into what it declares —
`you:doors:oak/archetype/door`. Every part comes from the install path.

## Entity

Everything in the world is one. Mods create, find and change entities; see
[Entities and control](/build/entities-and-control/).

## Gamemode

An ordinary mod that the server designates as the session's baseline rule layer.
Exactly one runs per session, and the engine has no gamemode concept beyond that one
slot — see [Gamemodes](/build/gamemodes/).

## Grant

A server owner's line in `config/server.toml` letting one mod act on entities another
mod created. Cleanup and moderation addons need one; nothing else does, and no grant
reaches a player's body — decorating players is a manifest declaration, not a grant.
See [Grants](/server/grants/).

## Host

The player running the session. Everything authoritative happens there, and today it
is a player rather than a dedicated machine — see [Run a server](/start/run-a-server/).

## Handle

An opaque reference to one entity, issued by the host and impossible to forge. It is
ephemeral: spent when you despawn the entity, and gone when your mod reloads. To reach the
same entity later, give it a name with `identify` and look it up with `find` — see
[Entities and control](/build/entities-and-control/).

## Label

A mod-written annotation on an entity: one line of text that answers for the thing it
is attached to. It states a fact about the entity; how it renders is the host's, so
there is no 2D or 3D variant. Text that is an entity's own content — a sign's face, a
screen — is not a label. See [Component rows](/reference/components/).

## Listen server

A session hosted by somebody who is also playing in it. It is the only kind Ironlark
has today; see [Running a server](/server/).

## Map

A world, authored as glTF plus a small manifest. Data the host owns, not code — see
[Maps](/maps/).

## Mod

A WebAssembly component the host loads. It can have a server half, a client half, or
both — see [Realms and the session lifecycle](/build/realms-and-lifecycle/).

## Name

What other players see you called. It belongs to your account, and the server states
it — you never type it in when joining, and nobody can arrive claiming to be someone
else.

## Owner

The mod that spawned an entity. It is recorded by the host, not claimed by the mod, and
it is what every verb checks before touching that entity — see
[who may act on an entity](/build/entity-ownership/).

## Part

One node inside a spawned scene, addressed by its path from the root — `"cap"`, or
`"arm/hand"`. Only nodes the model author named are reachable, and `part("")` is the root
itself.

## Realm

Which side a piece of a mod runs on: the authoritative server, or a player's client.
The two have different powers — see
[Realms and the session lifecycle](/build/realms-and-lifecycle/).

## Signal

A byte payload one mod sends on a named channel that other mods observe. Signals are
facts, not commands: nobody can consume or override one — see [Signals](/build/signals/).

## Sound

A short audio file an addon ships and declares, played through a bus. One declaration
covers a click and a longer piece; where the bytes live while it plays is the engine's
business — see [Playing a sound](/build/playing-sound/).

## User id

The id of an account. It is also the thing a session is addressed by: you join a host
by its user id rather than by an IP address, because there is no address to
type — see [Run a server](/start/run-a-server/).

## Workshop

The directory installed content lives in, `workshop/<author>/<addon>/<mod>/`. The depth is
fixed at three, and the layout is what gives every addon and every mod its identity — see
[Addons and identity](/addons/addons-and-identity/).
