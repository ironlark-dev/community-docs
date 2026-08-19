---
kind: reference
area: reference
title: "profile"
sidebar:
  order: 100
---

:::note[Generated]
From `host.wit`. Edit the WIT, not this page.
:::

The session roster: the server-resolved facts about a participant, as named
string values. Available in both worlds. Read-only — the host owns the table,
fills it when a player joins and drops the row when they leave; your mod never
holds a copy that can go stale.

## Functions

| Function | Summary |
|---|---|
| [`get-all`](#get-all) | Every value the session states about one player. |

### `get-all`

```wit
get-all: async func(player-id: string) -> list<tuple<string, string>>;
```

Every value the session currently states about one player. `player-id` is the
id every player-facing function speaks — the one `on-player-join` hands you.
An unknown player is an empty list, not an error, so a scoreboard can render
whatever is present and correct itself when the next change arrives.

Today the list carries exactly one entry: the display name, under the key
`name`. The server decides it — the platform account's handle is the default,
and a player whose account states none is shown by their id. More keys arrive
as data; your mod needs no rebuild to see them.

Display names are not identity. They are not unique, and nothing authenticates
what a session shows. Address players by their id, show them by their name —
never compare names to decide what a player may do.
