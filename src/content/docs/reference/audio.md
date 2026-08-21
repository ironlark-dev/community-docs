---
kind: reference
area: reference
title: "audio"
sidebar:
  order: 100
---

:::note[Generated]
From `host.wit`. Edit the WIT, not this page.
:::

## Functions

| Function | Summary |
|---|---|
| [`play`](#play) | Plays one of your declared clips on a category bus. |

### `play`

```wit
play: async func(clip: string, category: string, params: list<tuple<string, f32>>) -> result<_, string>;
```

Plays a clip once. Imported in both realms: called from your server half every
participant hears it, called from your client half it is that machine's alone.

`clip` follows the rule every name-taking import follows. A bare name is one of
your own `[declares] audio-clips` and the host qualifies it to
`<caller>/audio-clip/<name>`; a name carrying `:` is another mod's, taken as
written.

`category` is the bus the sound is heard on, and must be one of `effects`,
`footsteps` or `music`. The `interface` and `voice` buses belong to the host and
are refused: players keep interface audio loud, and grief noise must not be able
to wear the voice label.

`params` is a named-value list so it can grow without breaking a compiled mod.
One name is read today:

| Name | Range | Absent means |
|---|---|---|
| `volume` | 0.0 to 1.0, clamped | 1.0 |

A name the host does not read is ignored. Naming `volume` twice is refused, and
so is a value that is not a number.

Refused when the category is one you may not emit into, when the clip resolves
to nothing, when the volume is malformed, or when you are past your allowance —
eight sounds at once and four a second sustained, with a refusal carrying the
token `audio-quota:`.

`Ok` means the host accepted the sound and put it on the wire. It does not mean
anyone heard it: each listening machine applies its own gates, and a muted addon
or a silenced bus drops the sound without telling you.
