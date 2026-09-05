---
kind: reference
area: reference
title: "audio"
description: "One-shot sound playback on a named bus: server realm plays for every participant, client realm for this machine alone."
sidebar:
  order: 160
---

Part of the host contract in [`host.wit`](/host.wit). One-shot playback of a
declared sound: the server realm plays for every participant, the client realm
for this machine alone — the same call, reaching as far as the realm it was
made in. A muted mod, silenced bus or full bus drops the sound without telling
the caller. How sounds ship and are declared is
[Sound](/modding/presentation/sound/).

Imported by both worlds: `server-mod` and `client-mod`.

## `play`

```wit
enum bus { effects, environment, music, %interface }
```

The mixing lanes a mod may play on. The host's voice lane is absent on
purpose: the host writes voice, a mod does not, and voice arrives as its own
verb rather than as a case here.

```wit
play: async func(sound: sound-id, bus: bus, params: list<tuple<string, field-value>>) -> result<_, error>;
```

Plays the resolved sound on `bus`. The id comes from
[resolve.sound](/reference/resolve/#sound). `params` is a growable list of
named [field-value](/reference/types/#field-value) values; the host reads one
param, `"volume"`: a number, `0.0..=1.0`, clamped, `1.0` when the call names
none. A param name the host does not read is ignored, which is what lets the
list grow.

Refuses, as the [error record](/reference/types/#error):

- a forged, stale or undeclared sound id;
- a param whose value is not a number — a shape audio cannot apply is a
  refusal, never a silent drop;
- `"volume"` named more than once, or given a value that is not a finite
  number;
- a caller past its per-mod play rate — the quota refuses rather than queueing.

Success means the host admitted the play, not that anyone heard it: a muted
mod, a silenced bus or a full bus drops it silently by the listener's right.

## Related

- [Sound](/modding/presentation/sound/) — shipping and declaring sounds
- [resolve](/reference/resolve/#sound) — names to ids
