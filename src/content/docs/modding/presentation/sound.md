---
title: Playing a sound
description: Ship a sound file beside the manifest, declare it in one line, and play it with one call from either realm — with the bounds, the per-mod allowance, and what a listener may still silence.
kind: how-to
area: modding
sidebar:
  order: 10
---

A sound is three things: a file beside [`mod.toml`](/modding/mod/manifest/),
one line declaring it, and one call playing it. This page walks the whole path
using `ironlark:buttons`, a mod that ships with the game — press its pedestal
in a session and you hear everything below working.

```toml
# mod.toml — the sound is press.wav, beside this manifest.
[declares]
sounds = ["press"]
```

```rust
// The prelude brings in the audio module and SoundBus; `declares!` reads the
// manifest and mints `protocol::sound::Press` from the line above.
use ironlark::server::prelude::*;

mod protocol {
    ironlark::declares!("../mod.toml");
}

/// The press, heard by everyone in the session. A refusal is logged and the
/// press still happens: a mod that stops working because a listener muted it
/// would be worse than a silent button.
async fn press_sound() {
    if let Err(e) = audio::play(protocol::sound::Press, SoundBus::Effects)
        .volume(0.8)
        .await
    {
        log::warn!("buttons: press sound refused: {e}");
    }
}
```

Both realms import the same call. From your **server half** every participant
hears it; from your **client half** it is that machine's alone. The half
decides the reach, and nothing else does — there is no per-player argument
(see [one player only](#a-sound-only-one-player-hears)).

## Ship the file

The file sits beside `mod.toml`, named after the sound: `press` is `press.wav`
or `press.ogg`. Wav and ogg/vorbis are the only accepted formats. The name
obeys the same charset as everything else you declare — lowercase ASCII
letters, digits and hyphens, **no underscores**. `door_open` cannot be
declared, and a manifest that fails takes the whole mod with it, so the
symptom is "my mod vanished" rather than "my sound is broken". Name it
`door-open`.

Every declared sound is fully decoded when the session starts, not when it
first plays. The envelope it must fit:

| Bound | Limit |
|---|---|
| File size | at most 4 MiB |
| Length | at most 15 seconds of decoded audio |
| Sample rate | at most 48 kHz |
| Width | mono or stereo |

These are ceilings, not targets: a 44.1 kHz mono file is fine as it is. A file
that spends more than a few seconds decoding is refused too — that bound
exists for crafted files, and no honest recording meets it.

A sound outside the envelope, in a format the host does not take, or declared
with no file beside the manifest, **takes its mod out of the session on the
host**, with a log line naming the sound and the bound it broke. On a joining
machine the same defect only leaves that machine without the sound: a peer
that cannot read one file must not end up running a different set of mods
from everyone else.

These are one-shot bounds. Looping or continuous sound is not this mechanism
— what does not exist yet is on [the boundary](/boundary/).

## Declare it, then play it

The manifest line is the ownership statement: a sound you did not declare
cannot be played by you. `ironlark::declares!("../mod.toml")` reads the
manifest at build time and mints one item per sound — `sounds = ["press"]`
becomes `protocol::sound::Press`. The item resolves its session id once, on
first play, and reads it afterwards, so a sound on a hot path costs one
crossing into the host for the whole session. A name you misspell in code is
a compile error, not a runtime refusal.

`audio::play(sound, bus)` returns a builder; nothing fires until you await
it. One option chains onto it today:

| Option | Meaning |
|---|---|
| `.volume(0.5)` | 0.0 to 1.0; a finite value outside the range is clamped on each listening machine; a NaN or an infinity refuses the play at the caller. Unset means full volume. |

Volume scales this one sound against its neighbours. The bus gain and the
player's own mute sit on top of it, so it is never a claim about how loud a
player ends up hearing anything.

`Ok` means the host accepted the sound and put it on the wire. **It does not
mean anyone heard it** — see [what a listener decides](#what-a-listener-decides).

## The buses

The second argument names the mixing lane the sound plays on. Every listening
machine keeps one gain per bus, so a player who turns one down turns down a
kind of sound, not a mod:

| Bus | For |
|---|---|
| `SoundBus::Effects` | something that happened in the world: presses, impacts, footsteps |
| `SoundBus::Environment` | the place itself — weather, a room tone, anything continuous |
| `SoundBus::Music` | composed music, which a player commonly turns down on its own |
| `SoundBus::Interface` | feedback on this player's own act: the click answering their key |

The set is a closed Rust enum and it is the whole set. A misspelt bus does not
exist to spell, so it fails to compile instead of refusing once the session is
running. One more bus exists on every machine — `voice` — and belongs to the
host: a lane players trust to be other people talking must not carry a mod's
noise, so no mod can name it.

The wire still carries the bus as text, which is what lets the list grow:
a sound arriving from a newer build naming a bus this machine does not know
is heard on `effects` with one warning, rather than dropped.

## Your allowance

Sound is the cheapest way to be a nuisance, so it is counted per mod:

| | |
|---|---|
| Playing at once | 8 |
| Burst | 8 |
| Sustained | 4 per second |

Both counters bind, because either alone is easy to walk around. Past them,
`play` returns a refusal whose text starts with the stable token
`audio-quota:` — back off on `e.contains("audio-quota:")` without matching
prose. A rate refusal also says how long until the next sound would be
admitted.

Your count comes back as each sound ends. A reload does not hand your mod a
clean slate: what the previous instance started is still audible and still
counted against you. The table empties only when the session ends. The other
per-mod budgets live on [limits](/modding/limits/).

## What a listener decides

Everything after the host accepts your sound belongs to the machine hearing
it. Any of these silently drops it there:

- mod audio is off on that machine entirely
- the listener muted your mod by name
- your bus's gain is zero there
- that bus already carries 32 sounds
- that machine does not hold the sound — its own copy failed to decode, which
  is the one that fires when your sound works on your box and not on a
  friend's

None of it is reported back to you, because the same sound is playing
normally for everyone who did not silence it. Do not treat a played sound as
something that happened: it is an offer. Write the handler so a refusal is
logged and the rest still runs — the `press_sound` above is the shape.

To see which reason fired **on the listening machine**, read its log: every
audio record carries a `stage`, and `gate` is where that machine's own
decisions appear. On Linux, hearing nothing at all is most often the output
device, not the gate — start with [sound and devices](/start/linux/). For the
wider debugging path, see [troubleshooting](/modding/troubleshooting/).

## Another mod's sound

Your manifest cannot mint an item for a sound someone else declared, so a name
settled at run time goes through `resolve::sound` instead. The name is spelled
in full — the owning mod's [id](/modding/mod/identity/), the kind, and the
name that mod declared:

```rust
use ironlark::server::prelude::*;

ironlark::state! {
    /// Resolved once, kept for the session. A SoundId is Copy.
    static ALARM: Option<SoundId> = None;
}

async fn sound_the_alarm() {
    let id = match ALARM.get() {
        Some(id) => id,
        None => match resolve::sound("author:mod/sound/alarm") {
            Ok(id) => {
                ALARM.set(Some(id));
                id
            }
            Err(e) => {
                log::error!("this session carries no such sound: {e}");
                return;
            }
        },
    };
    if let Err(e) = audio::play(id, SoundBus::Effects).await {
        log::warn!("the alarm was refused: {e}");
    }
}
```

`audio::play` takes the resolved `SoundId` in the same position as the minted
item. The resolve refuses when no enabled mod declares that name — a sound is
resolvable only in a session that carries it, so resolve once and keep the
answer in a state cell rather than resolving per call.

## A sound only one player hears

A server-half `play` reaches everyone; there is no per-player argument. To
reach one player, tell that player and let their machine play it: send with
`signal_to`, observe on the client half, and call `play` there. The shipped
`ironlark:echo` mod does exactly this crossing — its server half states a
value to one joiner, its client half observes and presents it. Both fences
below are its real halves:

```rust
// echo, server half — the on_join hook of its ServerMod impl.
// One player is told, nobody else.
async fn on_join(_ctx: Context, player: Player) {
    let value = VALUE.get();
    if let Err(e) = signal_to(player.session(), &Value { value }) {
        log::warn!("echo server: stating the value failed: {e}");
    }
}
```

```rust
// echo, client half — its init subscribes, the handler presents.
// `Value::observe(on_value);` is the one line init contributes.
async fn on_value(_ctx: Context, _from: SourceId, stated: Value) {
    ui::set_overlay_text(&format!("echo: {}", stated.value));
}
```

Echo presents on [the overlay](/modding/presentation/overlay/); a sound mod's
handler calls `audio::play` in that same position instead — the client
prelude carries `audio` and `SoundBus` too, and a client-half play is heard by
that machine alone, which is the point. The signal and its payload type come
from the mod's own schema; that half of the pattern is on
[signals](/modding/messaging/signals/).

## Every signature

The dry contract behind all of this — the play call, the bus cases, the error
shape — is in the [`audio` reference](/reference/audio/).
