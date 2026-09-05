---
title: "Messaging"
description: "One bus and one awaited ask: how mods and their halves talk — signals that announce facts to a declared audience, and requests the server half answers."
kind: explanation
area: modding
sidebar:
  order: 0
---

Mods never hold each other's entities and never call each other's functions
([why](/modding/world/ownership/)). What crosses between mods, and between the two
halves of one mod, is typed messages — declared once in the mod's
[protocol schema](/modding/mod/protocol-schema/), carried by the host.

There are exactly two kinds:

- **A signal is an announcement.** A raise states a fact — *the door opened*, *here is
  who stands where* — and stops. Whoever observed the name hears it, the raiser
  included; nobody answers, nothing is addressed, and there is no consuming or vetoing
  it. [Signals](/modding/messaging/signals/).
- **A request is the one awaited ask.** A mod's client half asks its own server half a
  typed question and waits for the answer — which may be a typed no.
  [Requests](/modding/messaging/requests/).

## Where a raise can land

A signal has no addressee. Its declaration states the **audience** — one fact with three
values — and that settles where every raise of it lands:

| Audience | Who hears it |
|---|---|
| `SERVER_MODS` | The other server halves in the session — one bus on the hosting machine. How mods that have never heard of each other cooperate. |
| `CLIENT_MODS` | The other client halves on the raising machine — nothing leaves it. How an overlay paints what a gameplay mod noticed. |
| `CLIENTS` | Across the network to every participant's client realm. How the authority tells the screens what is true — your own mod's client half included. |

That is the whole map of who can say what to whom. A server half raises on the server
bus or across to the clients; a client half raises on its own machine's bus and, for
anything that must be true for everyone, asks its server half through a request. Reaching
another participant's machine is the authority's act alone.

Facts on the bus are how gameplay composes: the bundled button announces a press, the
gamemode hears it and commands the balloons, and neither content mod knows the other
exists — the chain is walked through on [signals](/modding/messaging/signals/).
