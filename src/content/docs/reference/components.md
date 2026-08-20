---
kind: reference
area: reference
title: "Component rows"
description: "Every component a mod can read or write through set-component and get-component: fields, value kinds, defaults, and per-row properties."
sidebar:
  order: 35
---

:::note[Generated values]
Defaults quoted here are the host's registered values; they cross the wire, so
every peer sees the host's numbers, never its own build's.
:::

Capability grows by rows in this table, never by new verbs. Two properties a
row can carry:

- **Insertable** — the first `set-component` attaches the component: the host
  builds the row's defaults, applies your fields over them, and inserts the
  result whole. Unset fields take the defaults below, which makes them public
  contract. A grant never inserts, and neither does anything on a row not
  marked insertable.
- **Writer-scoped** — while the row's value is off its defaults, it answers to
  the mod that wrote it: only that mod changes it, anyone with write reach may
  reset it to the defaults, and the reset releases it. Writing the defaults
  back is the release; there is no release verb.

| Row | Insertable | Writer-scoped |
|---|---|---|
| `transform` | no | no |
| `material` | no | no |
| `label` | yes | yes |

## `transform`

| Path | Kind | Notes |
|---|---|---|
| `translation` | vec3 | on a physics body, routes to the physics position |
| `rotation` | quat | on a physics body, routes to the physics rotation |
| `scale` | vec3 | always the render transform; physics has no scale |

Not insertable: everything placeable already carries one.

## `material`

| Path | Kind | Notes |
|---|---|---|
| `base_color` | rgba | writes every mesh in the entity's subtree; the shared asset is cloned per mesh on first write, so one instance never tints another |

## `label`

One line of world-anchored text over the entity, rendered by the engine on
every peer with a camera. World text, not a UI widget — presentation stays the
host's.

| Path | Kind | Default | Notes |
|---|---|---|---|
| `text` | text | `""` | empty renders nothing and is the released state; content rules of the [value vocabulary](/reference/entity/#field-value) apply — 256-byte cap, no control characters, at least one visible character |
| `offset` | vec3 | `(0, 1.2, 0)` | meters from the entity's origin along the world axes; never rotated with the entity |
| `max_distance` | number | `30` | camera distance beyond which the label is invisible |
| `fade` | number | `5` | width of the fade band inside `max_distance`, in meters |

Visibility is `alpha = clamp((max_distance - distance) / fade, 0, 1)`; a fade
of zero (or effectively zero) is a hard cutoff at `max_distance`.

Two idioms, distinct on purpose:

- **Hide without releasing:** write `max_distance` to `0`. The text stays
  yours — the row is still claimed — but nothing renders.
- **Release:** write every field back to its default (in the common case,
  where only `text` was ever set: write `text` to `""`). The row is free for
  the next writer, holding no leftover offsets or distances.

The label the local player would see over their own body is never rendered.
