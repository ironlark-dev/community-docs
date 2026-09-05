---
kind: reference
area: reference
title: "ui"
description: "The overlay surface a client half can write: one line of text."
sidebar:
  order: 150
---

Part of the host contract in [`host.wit`](/host.wit). The one drawing surface
a mod has today: a single line of overlay text on the local machine. Anything
richer is described on [Overlay](/modding/presentation/overlay/).

Imported by the client world (`client-mod`) only — the server realm has no
screen to write.

## `set-overlay-text`

```wit
set-overlay-text: func(text: string);
```

Replaces this mod's overlay line with `text`. No result: one line of text is
the whole contract, so a novel is cut where a line would end anyway — at 128
characters, with a debug line in the host log naming the cut. Characters
rather than bytes, so the cut cannot split a code point.

## Related

- [Overlay](/modding/presentation/overlay/) — what the overlay is and is not
- [client-api](/reference/client-api/) — where a client half runs
