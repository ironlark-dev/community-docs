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
| [`play`](#play) | Plays one of your declared sounds on a bus. |

### `play`

```wit
play: async func(sound: string, bus: string, params: list<tuple<string, f32>>) -> result<_, string>;
```

Plays a sound once. Imported in both realms: called from your server half every
participant hears it, called from your client half it is that machine's alone.

`sound` follows the rule every name-taking import follows. A bare name is one of
your own `[declares] sounds` and the host qualifies it to
`<caller>/sound/<name>`; a name carrying `:` is another mod's, taken as
written.

`bus` is where the sound is heard, and must be one of `effects`, `environment`,
`music` or `interface`. The `voice` bus belongs to the host and is refused:
grief noise must not be able to wear the voice label, and a sound you ship is
not a voice.

`params` is a named-value list so it can grow without breaking a compiled mod.
One name is read today:

| Name | Range | Absent means |
|---|---|---|
| `volume` | 0.0 to 1.0, clamped | 1.0 |

A name the host does not read is ignored. Naming `volume` twice is refused, and
so is a value that is not a number.

Refused when the bus is one you may not emit into, when the sound resolves
to nothing, when the volume is malformed, or when you are past your allowance —
eight sounds at once and four a second sustained, with a refusal carrying the
token `audio-quota:`.

`Ok` means the host accepted the sound and put it on the wire. It does not mean
anyone heard it: each listening machine applies its own gates, and a muted addon
or a silenced bus drops the sound without telling you.
