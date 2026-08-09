---
title: "Connectivity"
description: "Why there is no port to forward, how players reach a host that is behind a router, and what to do when a direct path cannot be found."
kind: explanation
area: server
sidebar:
  order: 4
---

## There is no server port

Ironlark does not listen on a port. Players connect peer-to-peer over WebRTC, and a
fresh port is negotiated for each player that connects. There is nothing to forward,
open, or write a firewall rule for.

If you came from a game where hosting means opening a port, this is the one habit to
drop. Time spent in a router admin panel is time wasted here.

## Players connect to an identity, not an address

A session is addressed by **who is hosting it** — the host's identity id, which is the
id of their account. There is no host address anywhere in the system, so there is
nothing to publish, and nothing that changes when the host's network does.

## How a connection is actually made

Both peers gather candidate paths to each other and try them. Three kinds:

| Kind | What it is |
|---|---|
| host | a direct address on the machine's own network |
| server reflexive | the address a router presents to the internet, discovered via STUN |
| relay | a third machine that forwards traffic, via TURN |

Direct is tried first and used when it works. Behind most home routers it does. Behind
a symmetric NAT it does not, and that is what relays exist for.

## Where the relay comes from

The game asks the core server for a set of relays when a session starts — once per
session, not once per player. Those come with their own short-lived credentials. You
do not configure this and you do not run it.

If that fetch fails, the game falls back to public STUN servers, which can discover an
address but cannot relay. A peer behind a symmetric NAT stays unreachable in that
state.

Relay traffic is UDP.

## Overriding the relays

Only useful if you are running your own, or reproducing a connectivity problem.

| Flag | Effect |
|---|---|
| `--ice-servers` | comma-separated `stun:` / `turn:` / `turns:` URLs, replacing the fetched set |
| `--turn-username`, `--turn-password` | credentials for the TURN URLs above; meaningless without them, since a fetched set carries its own |
| `--ice-transport-policy relay` | refuse every candidate except relay |

`--ice-transport-policy relay` is the way to exercise the relay path from a network
that would otherwise connect directly. It is a test tool: it makes a working direct
connection fail on purpose.
