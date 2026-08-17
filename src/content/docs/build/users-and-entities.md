---
kind: explanation
area: build
title: "Users, entities and control"
sidebar:
  order: 10
---

Ironlark keeps **who you are** separate from **what you are driving**. That split is
what lets spectating, respawning and swapping between bodies be one mechanism
instead of three special cases. This page explains the model your mod is written
against.

## The three pieces

| Concept | What it is | In one line |
|---|---|---|
| **User** | The account you signed in with. | *Who is connected.* |
| **Entity** | A thing in the world — usually a character body, but also a vehicle, a turret, a prop. | *What exists.* |
| **Controller** | What drives an entity. Today that is always a user. | *What is steering.* |

And the link between them:

- **Control** — a controller drives an entity. It is a separate, **transferable**
  relationship, not something baked into the entity when it is created.

A **body** is not a fourth kind of thing. It is the word for an entity that is
currently under a controller. Any entity can be controlled.

## Who a user is, and who says so

A user is the account, and the host does not take your word for it. When you join,
the platform tells the host which account you are and what you are called; the
joining game never states either. Two consequences worth knowing before you design
around it:

- **A joining player cannot pick their own name.** It comes from their account, so
  nobody arrives claiming to be someone else. This is a statement about joining, not
  a guarantee about what you see on screen: the host runs the session and draws the
  interface, so a modified host can display whatever it likes. Trust the user id,
  which the platform states, rather than the name beside it.
- **One account is in a session once.** A second connection from the same account is
  refused, so a user id identifies exactly one participant for as long as the
  session runs.

Your mod sees a user id — an opaque string. Treat it as an identifier to compare and
store, never as something to show a player: names are for showing, ids are for
deciding.

## Control: who drives what

Creating an entity and controlling it are **two separate steps**. That is what makes
these the same mechanism rather than separate features:

- **Swap bodies** — release one entity, control another. Any entity is
  controllable, so the other one can be a vehicle or a turret rather than a second
  character.
- **Spectate** — be a connected user controlling *nothing*. A gamemode that turns
  off the default spawn gets this for free.

```text
control(player, entity)   // start driving it
release(entity)           // stop; the entity stays in the world, uncontrolled
```

The parameter is called `player` and takes a user id.

One controller drives one entity in every shipped mod. The engine does not forbid
holding a second, but nothing ships that way, so treat it as unexplored rather than
as a supported pattern.

**There is no AI controller.** Handing an entity to a computer-driven controller is
described in the design but does not exist, so "release it and let the AI take over"
is not something you can build against. Releasing leaves the entity uncontrolled.

## Reading who is driving what

A controlled entity does not store its driver. The relationship is read *through*
the control link, which is why handing a car to another player changes who owns
the car's actions without rewriting anything on the car.

For the exact functions, see [Entity](/reference/entity/) — `control`, `release`
and `body-of` are the three you will reach for.

## Death is a choice, not a rule

Because the layers are separate, a gamemode decides what "death" destroys:

| What ends | What survives | Typical use |
|---|---|---|
| The entity | the user's connection | respawn — deathmatch |
| The control link | both | ejected from a vehicle, or a possession ending |
| The connection | the world, and whatever the gamemode kept | a player leaves |

Nothing in the engine forces one of these. A gamemode that never destroys an entity
is as valid as one that destroys it on every hit — and clearing up after a player
who leaves is the gamemode's job, not something the engine does for you.

## What this does not include

**One account is one participant.** Several characters per account — alt-characters
with their own names, stats and saves, the way a roleplay server wants — is a layer
that does not exist. A user has one presence in a session, and a mod that wants
per-character state keeps it in its own storage keyed by the user id.

Per-character personas, and any rule about which players may see which of another
player's details, are on [What does not exist yet](/boundary/). Design against the
model on this page rather than around the one that is coming.

## See also

- [Entity](/reference/entity/) — the functions, with their exact signatures.
- [Gamemodes](/build/gamemodes/) — gamemodes decide when to spawn, control and
  retire entities.
