---
kind: how-to
area: build
title: "Playing a sound"
description: "Ship a clip with your addon, declare it in the manifest, and play it with one call — from either realm."
sidebar:
  label: "Playing a sound"
  order: 47
---

A sound is a file you ship, a line in your manifest, and one call. Played from
your server half every participant hears it; played from your client half it is
that machine's alone.

## Ship the clip

The file sits beside `mod.toml`, named after the clip:

```
ironlark/core/buttons/
  mod.toml
  press.wav
```

Wav or ogg/vorbis. Nothing else is accepted, and every clip is fully decoded
when the addon loads rather than when it first plays — so a file that is
malformed, too long or too loud a format is caught at the session's start, with
the reason in the log, instead of hitching a frame later.

The envelope a clip must fit:

| Bound | Limit |
|---|---|
| File size | 4 MiB |
| Length | 15 seconds |
| Sample rate | 48 kHz |
| Channels | 2 |

These are one-shot bounds. Long or looping sound is not this mechanism.

## Declare it

```toml
[declares]
audio-clips = ["press"]
```

The name is the file's, without its extension. A clip you did not declare
cannot be played, and a clip you declared with no file beside the manifest
takes your mod out of the session on the host with a line naming both names it
looked for.

## Play it

```rust
use ironlark::host::audio::play;

let params = vec![("volume".to_string(), 0.8)];
if let Err(e) = play("press".to_string(), "effects".to_string(), params).await {
    log(Level::Warn, &format!("press sound refused: {e}"));
}
```

`"press"` is your own clip. To play a clip another addon ships, name it in full:
`"ironlark:core:buttons/audio-clip/press"` — the same rule every other
name-taking call follows.

`Ok` means the host accepted it. It does not mean anyone heard it: see
[what a listener decides](#what-a-listener-decides).

## The three buses

Your sound is heard on a bus the listener controls separately:

| Bus | For |
|---|---|
| `effects` | one-shots: presses, impacts, pickups |
| `footsteps` | locomotion |
| `music` | anything a player will want to turn down on its own |

Two more exist — `interface` and `voice` — and belong to the host. Naming
either is refused. Players keep interface audio loud and rarely mute it, and a
bus players trust to be other people talking must not be able to carry an
addon's noise.

An unknown bus name is not an error on the listening machine: it is heard on
`effects` with one warning. That is what lets a bus be added later without
silencing an addon compiled against the older list.

## Your allowance

Sound is the cheapest way to be a nuisance, so it is counted per addon:

| | |
|---|---|
| At once | 8 sounds |
| Sustained | 4 a second |
| Burst | 8 |

Both bind, because either alone is easy to walk around. Past them, `play`
returns a refusal whose text starts with `audio-quota:` — a stable token, so
you can back off on it without matching prose.

Your count comes back as each sound ends, and everything you hold is returned
if your mod is reloaded or quarantined.

## What a listener decides

Everything after the host accepts your sound belongs to the machine hearing it.
Any of these silently drops it:

- addon audio is off entirely
- the listener muted your addon by name
- your bus's gain is zero
- that bus already carries 32 sounds

None of this is reported back to you, because the same sound is playing
normally for everyone who did not silence it. Do not treat a played sound as
something that happened: it is an offer.

Write your handler so a refusal is logged and the rest still runs. A button
that stops toggling because someone muted your addon is a worse bug than a
silent button.

## Proving it works

The bundled `ironlark:core:buttons` addon plays `press` from its interact
handler — press the button in game and you hear it. Its manifest and source are
the shortest complete example of everything on this page.
