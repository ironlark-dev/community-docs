---
title: "gamemode"
linkTitle: "gamemode"
weight: 90
description: >
  Host-owned gamemode/session settings a server-mod configures.
---

{{% alert title="Generated" color="info" %}}
From `host.wit`. Edit the WIT, not this page.
{{% /alert %}}

## Functions

| Function | Summary |
|---|---|
| [`set-default-spawn`](#set-default-spawn) | Toggle the host's default spawn-on-join (ADR 0014 free-roam baseline). |

### `set-default-spawn`

```wit
set-default-spawn: func(enabled: bool);
```

Toggle the host's default spawn-on-join (ADR 0014 free-roam baseline). ON by
default. A gamemode that owns placement calls set-default-spawn(false) in init(),
then spawns via entity.spawn + entity.control from on-player-join.

