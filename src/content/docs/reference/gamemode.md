---
kind: reference
area: reference
title: "gamemode"
description: "Host-owned gamemode/session settings a server-mod configures."
sidebar:
  order: 90
---

:::note[Generated]
From `host.wit`. Edit the WIT, not this page.
:::

Imported by a mod's server half only.

## Functions

| Function | Summary |
|---|---|
| [`set-default-spawn`](#set-default-spawn) | Toggle the host's default spawn-on-join (the free-roam baseline). |

### `set-default-spawn`

```wit
set-default-spawn: func(enabled: bool);
```

Toggle the host's default spawn-on-join (the free-roam baseline). ON by
default. A gamemode that owns placement calls set-default-spawn(false) in init(),
then spawns via entity.spawn + entity.control from on-player-join.

