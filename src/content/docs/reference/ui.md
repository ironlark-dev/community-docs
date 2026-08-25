---
kind: reference
area: reference
title: "ui"
sidebar:
  order: 100
---

:::note[Generated]
From `host.wit`. Edit the WIT, not this page.
:::

Imported by a mod's client half only.

## Functions

| Function | Summary |
|---|---|
| [`set-overlay-text`](#set-overlay-text) | Writes this mod's own overlay line. |

### `set-overlay-text`

```wit
set-overlay-text: func(text: string);
```

Writes this mod's line on the on-screen overlay. Each mod has its own line —
another addon writing does not erase yours — shown in the enabled set's order.
An empty string clears your line, and it is also cleared when your client half
unloads. Text is cut at 128 characters: the overlay is one line per mod, not a
panel.

