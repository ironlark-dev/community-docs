---
kind: how-to
area: build
title: "Playing a sound"
description: "Ship a clip with your addon, declare it in the manifest, and play it with one call — from either realm."
sidebar:
  label: "Playing a sound"
  order: 47
---

```toml
# mod.toml — a clip is yours only if you declare it. The file is press.wav,
# beside this manifest.
[declares]
audio-clips = ["press"]
```

```rust
use ironlark::host::audio::play;

play("press".to_string(), "effects".to_string(), vec![]).await?;        // your own, bare
play("ironlark:core:buttons/audio-clip/press".to_string(),              // someone else's, in full
     "effects".to_string(),
     vec![("volume".to_string(), 0.8)]).await?;
```

Imported in both realms. Called from your server half every participant hears
it; called from your client half it is that machine's alone. `play` is async, so
it belongs inside one of your `async` handlers.

## Ship the clip

The file sits beside `mod.toml`, named after the clip:

```
ironlark/core/buttons/
  mod.toml
  press.wav
```

Wav or ogg/vorbis. Nothing else is accepted, and every clip is fully decoded
when the addon loads rather than when it first plays — so a file that is
malformed, too long, or in a format the host does not take is caught at the
session's start with the reason in the log, instead of hitching a frame later.

The envelope a clip must fit:

| Bound | Limit |
|---|---|
| File size | 4 MiB |
| Length | 15 seconds |
| Sample rate | 48 kHz |
| Channels | 2 |

These are one-shot bounds. Long or looping sound is not this mechanism.

## Declare it

The name is the file's, without its extension. A clip you did not declare
cannot be played, and a clip you declared with no file beside the manifest takes
your mod out of the session on the host, with a line naming both filenames it
looked for.

## Call it

The third argument is a list of named parameters rather than fixed fields, so
the host can learn new ones without breaking an addon that was compiled before
them. One name is read today:

| Name | Range | Absent means |
|---|---|---|
| `volume` | 0.0 to 1.0, clamped | 1.0 |

Pass `vec![]` when you have nothing to say. A name the host does not know is
ignored.

`Ok` means the host accepted your sound and put it on the wire. It does not mean
anyone heard it — see [what a listener decides](#what-a-listener-decides).

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

None of it is reported back to you, because the same sound is playing normally
for everyone who did not silence it. So do not treat a played sound as something
that happened: it is an offer.

Write your handler so a refusal is logged and the rest still runs. A button that
stops toggling because someone muted your addon is a worse bug than a silent
button.

## A whole one, working

This is `ironlark:core:buttons`, the addon that ships with the game. Press its
pedestal in game and you hear the clip.

```toml
# mod.toml
[declares]
channels = ["pressed"]
audio-clips = ["press"]
```

```rust
use ironlark::host::audio::play;
use ironlark::host::log::{Level, log};

impl Guest for Component {
    async fn on_interact(
        player_id: String,
        target: String,
        _hit_point: exports::ironlark::host::server_api::Vec3,
        distance: f32,
    ) {
        if target != BUTTON_ID {
            return;
        }
        // ... the press does its work ...
        press_sound().await;
    }
}

/// The press, heard by everyone in the session. A refusal is logged and the
/// press still happens: a mod that stops working because a listener muted it
/// would be worse than a silent button.
async fn press_sound() {
    let params = vec![("volume".to_string(), 0.8)];
    if let Err(e) = play("press".to_string(), "effects".to_string(), params).await {
        log(Level::Warn, &format!("buttons: press sound refused: {e}"));
    }
}
```

Every signature here is in the [`audio` reference](/reference/audio/).
