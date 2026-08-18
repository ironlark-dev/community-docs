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
reaches a player's body — see [Grants](/server/grants/).

## Host

The player running the session. Everything authoritative happens there, and today it
is a player rather than a dedicated machine — see [Run a server](/start/run-a-server/).

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

## Realm

Which side a piece of a mod runs on: the authoritative server, or a player's client.
The two have different powers — see
[Realms and the session lifecycle](/build/realms-and-lifecycle/).

## Signal

A byte payload one mod sends on a named channel that other mods observe. Signals are
facts, not commands: nobody can consume or override one — see [Signals](/build/signals/).

## User id

The id of an account. It is also the thing a session is addressed by: you join a host
by its user id rather than by an IP address, because there is no address to
type — see [Run a server](/start/run-a-server/).

## Workshop

The directory installed content lives in, `workshop/<namespace>[/<addon>]/`. Its layout
is what gives every addon its identity — see
[Addons and identity](/addons/addons-and-identity/).
