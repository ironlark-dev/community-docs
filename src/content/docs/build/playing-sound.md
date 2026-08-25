---
kind: how-to
area: build
title: "Playing a sound"
description: "Ship a sound with your addon, declare it in the manifest, and play it with one call — from either realm."
sidebar:
  label: "Playing a sound"
  order: 47
---

```toml
# mod.toml — a sound is yours only if you declare it. The file is press.wav,
# beside this manifest.
[declares]
sounds = ["press"]
```

```rust
use ironlark::host::audio::play;

play("press".to_string(), "effects".to_string(), vec![]).await?;        // your own, bare
play("ironlark:core:buttons/sound/press".to_string(),                   // someone else's, in full
     "effects".to_string(),
     vec![("volume".to_string(), 0.8)]).await?;
```

Imported in both realms. Called from your server half every participant hears
it; called from your client half it is that machine's alone. `play` is async, so
it belongs inside one of your `async` handlers.

## Ship the sound

The file sits beside `mod.toml`, named after the sound. The name obeys the same
charset as everything else you declare — lowercase ASCII, digits and hyphens,
**no underscores**. `door_open.wav` cannot be declared, and a manifest that
fails takes the whole mod with it, so the symptom is "my mod vanished" rather
than "my sound is broken". Name it `door-open.wav`.

```
ironlark/core/buttons/
  mod.toml
  press.wav
```

Wav or ogg/vorbis. Nothing else is accepted, and every sound is fully decoded
when the addon loads rather than when it first plays — so a file that is
malformed, too long, or in a format the host does not take is caught at the
session's start with the reason in the log, instead of hitching a frame later.

The envelope a sound must fit:

| Bound | Limit |
|---|---|
| File size | at most 4 MiB |
| Length | at most 15 seconds |
| Sample rate | at most 48 kHz |
| Channels | at most 2 |

A ceiling, not a target: a 44.1 kHz mono sound is fine as it is.

These are one-shot bounds. Long or looping sound is not this mechanism.

## Declare it

The name is the file's, without its extension. A sound you did not declare
cannot be played, and a sound you declared with no file beside the manifest takes
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

## The buses

Your sound is heard on a bus the listener controls separately:

| Bus | For |
|---|---|
| `effects` | one-shots caused by something in the world: presses, impacts, pickups |
| `environment` | continuous background: wind, rain, a generator's hum |
| `interface` | your own interface, with no position |
| `music` | anything a player will want to turn down on its own — but see the length bound above: real background music needs looping, which does not exist yet |

One more exists — `voice` — and belongs to the host. Naming it is refused: a
bus players trust to be other people talking must not be able to carry an
addon's noise, and a sound you ship is not a voice.

Your own typo is **not** covered by that. `play("efects", ...)` is refused at
the call, naming the bus you wrote — the check is a string compare against the
names above, so it happens at runtime and nowhere earlier. There is nothing to
declare, so nothing catches it at load. Log the `Err` or you will not see it.

Separately, and only for sounds arriving from a newer peer: a bus name this
build does not know is heard on `effects` with one warning rather than dropped.
That is what lets a bus be added later without silencing an addon compiled
against the older list.

## Your allowance

Sound is the cheapest way to be a nuisance, so it is counted per mod — an addon of
three mods holds three allowances, and a refusal names the mod:

| | |
|---|---|
| At once | 8 sounds |
| Sustained | 4 a second |
| Burst | 8 |

Both bind, because either alone is easy to walk around. Past them, `play`
returns a refusal carrying `audio-quota:` after the mod's own id — a stable
token, so you can back off on `e.contains("audio-quota:")` without matching
prose.

Your count comes back as each sound ends, and everything you hold is returned
if your mod is reloaded or quarantined.

## What a listener decides

Everything after the host accepts your sound belongs to the machine hearing it.
Any of these silently drops it:

- addon audio is off entirely
- the listener muted your addon by name
- your bus's gain is zero
- that bus already carries 32 sounds
- that machine does not hold the sound — its own copy failed to decode, which is
  the one that fires when your sound works on your box and not on a friend's

None of it is reported back to you, because the same sound is playing normally
for everyone who did not silence it. So do not treat a played sound as something
that happened: it is an offer.

Write your handler so a refusal is logged and the rest still runs. A button that
stops toggling because someone muted your addon is a worse bug than a silent
button.

To find out which of these happened, read the log: every audio record carries a
`stage`, and `gate` is where this machine's own decisions appear. On Linux, start
with [sound and devices](/start/linux/) — the commonest cause of hearing nothing at
all is the output, not the gate.

## A sound only one player hears

`play` from your server half reaches every participant; there is no per-player
argument. To reach one player, send to them and let their machine play it:

```rust
// server half: tell one player, on a channel you declared
broadcast::send_to(player_id, "chime".to_string(), vec![]).await?;
```

```rust
// client half: that machine, and only that machine, plays
async fn on_message(channel: String, _data: Vec<u8>) {
    if channel != "chime" { return; }
    let _ = play("chime".to_string(), "effects".to_string(), vec![]).await;
}
```

It costs a declared channel and a client half, and it is the only route today.
See [Broadcast and RPC](/build/broadcast-and-rpc/) for the channel half of it.

## A whole one, working

This is `ironlark:core:buttons`, the addon that ships with the game. Press its
pedestal in game and you hear the sound.

```toml
# mod.toml
[declares]
channels = ["pressed"]
sounds = ["press"]
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
