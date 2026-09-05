---
kind: reference
area: reference
title: "Command line"
description: "Every flag the game takes, and what you must pass when you start it yourself instead of through the launcher."
sidebar:
  order: 10
---

Two ways to start the game, and they differ in one important respect.

**Through the launcher.** It passes the endpoints and hands the game a session, so
the game never sees your password. Nothing below is required.

**Directly.** You are responsible for the three endpoint flags and for
authentication. The defaults are all `127.0.0.1`, so a binary started with no flags
looks for a backend on your own machine and will not find one. Use the endpoints you
were given with your access.

```sh
./ironlark-game \
  -c <core server> \
  -i <sign-in server> \
  -s <signalling websocket> \
  --become-host
```

## Session

| Flag | Default | Meaning |
|---|---|---|
| `-b`, `--become-host` | off | Host the session. |
| `--connect-to <id>` | none | Join the session hosted by this user id. |
| `--map <id>` | configured | Map to load, as `<author>:<mod>`. Host only; a joining player loads the host's. |
| `--gamemode <id>` | configured | Which mod holds the gamemode role, as `<author>:<mod>`. Exactly one runs per session; any other installed gamemode stays unloaded. |

With neither `--become-host` nor `--connect-to`, the game opens its own menu.

With `--gamemode` unset and nothing configured, the session resolves to the
only installed candidate. It deliberately does not fall back to a named mod: a
default spelled in the host would be the host knowing a specific piece of
gameplay, and with two candidates installed there is no answer worth guessing
— the session refuses to start and says which to pick.

## Where things live

| Flag | Default | Meaning |
|---|---|---|
| `--config <path>` | `config/server.toml` beside the install | Configuration file for this run. |
| `--content <dir>` | the install's `assets/` | Directory holding `workshop/`. Two instances on one machine can each have their own. |

See [Configuration](/server/configuration/) for what goes in the file.

## Endpoints

| Flag | Default |
|---|---|
| `-c`, `--core-server-address` | `http://127.0.0.1:8080` |
| `-i`, `--idm-server-address` | `http://127.0.0.1:4433` |
| `-s`, `--signaling-server-address` | `ws://127.0.0.1:8000/connection/websocket` |

## Authentication

| Flag | Default |
|---|---|
| `-e`, `--email` | a local test account |
| `-p`, `--password` | a local test account |

You sign in with your email address. It is not the name other players see: that
comes from your account, and the server tells everyone what it is.

The defaults exist for local development against a seeded backend and are not an
account on anything you would join.

Prefer the environment variable `IRONLARK_SESSION_TOKEN`, which carries a session
established elsewhere. That is what the launcher sets, and why the game never handles
your password: a process's command line is readable by anyone on the machine, its
environment is not.

## NAT traversal

Only useful when reproducing a connectivity problem, or running your own relay. The
pool is otherwise fetched for you — see [Connectivity](/server/connectivity/).

| Flag | Default | Meaning |
|---|---|---|
| `--ice-servers <urls>` | fetched | Comma-separated `stun:` / `turn:` / `turns:` URLs, replacing the fetched set. When none are passed and none could be fetched, the game falls back to public STUN, which discovers a reflexive address and nothing more — there is no relay in the fallback, so a peer behind a symmetric NAT stays unreachable. |
| `--turn-username`, `--turn-password` | empty | Credentials for those TURN URLs. Meaningless without `--ice-servers`, since a fetched set carries its own. |
| `--ice-transport-policy <policy>` | `all` | `relay` refuses every candidate except a relayed one. A test tool: it makes a working direct connection fail on purpose. |

## Rendering

| Flag | Default | Meaning |
|---|---|---|
| `--uncapped` | off | Render without vsync, for profiling. On by default the presentation is capped, so the game does not peg the GPU and starve the compositor and audio. |
