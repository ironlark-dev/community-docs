---
kind: reference
area: reference
title: "Command line"
description: "Every flag the game takes, and what you must pass when you start it yourself instead of through the launcher."
sidebar:
  order: 1
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
  -i <identity server> \
  -s <signalling websocket> \
  --become-host
```

## Session

| Flag | Default | Meaning |
|---|---|---|
| `-b`, `--become-host` | off | Host the session. |
| `--connect-to <id>` | none | Join the session hosted by this identity id. |
| `--map <id>` | configured | Map to load, as `namespace:path`. Host only; a joining player loads the host's. |
| `--gamemode <id>` | configured | Which mod holds the gamemode role. |

With neither `--become-host` nor `--connect-to`, the game opens its own menu.

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
| `-u`, `--username` | a local test account |
| `-p`, `--password` | a local test account |

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
| `--ice-servers <urls>` | fetched | Comma-separated `stun:` / `turn:` / `turns:` URLs, replacing the fetched set. |
| `--turn-username`, `--turn-password` | empty | Credentials for those TURN URLs. Meaningless without `--ice-servers`, since a fetched set carries its own. |
| `--ice-transport-policy <policy>` | `all` | `relay` refuses every candidate except a relayed one. A test tool: it makes a working direct connection fail on purpose. |

## Rendering

| Flag | Default | Meaning |
|---|---|---|
| `--uncapped` | off | Render without vsync, for profiling. On by default the presentation is capped, so the game does not peg the GPU and starve the compositor and audio. |
