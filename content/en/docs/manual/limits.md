---
title: "Limits and pacing"
linkTitle: "Limits and pacing"
weight: 90
description: >
  The real numbers, and the three places the host drops your work on purpose
  rather than stalling the world.
---

## Caps

| Limit | Value | What happens past it |
|---|---|---|
| `find` / `overlap` results | 1024 | the list is capped |
| Signal channel name | 256 bytes | `emit`/`subscribe` returns an error |
| Signal payload | 64 KiB | `emit` returns an error |
| Per-mod signal inbox | 64 pending | that delivery is shed, loudly |
| Signals queued before mods finish loading | 256 | `emit` returns an error |
| Interact reach | 3.0 m from the body | the press does not resolve |
| Character step-up | 0.3 m | taller ledges block movement |

### What 64 KiB actually holds

A number is not a feel. Taking the shape `freeroam` already publishes — a player id and a
position — and filling the cap exactly:

| The same 826 records, as | Bytes | |
|---|---|---|
| compact JSON | 65,481 | fits, just |
| pretty-printed JSON (indent 2) | 100,185 | **rejected — 1.5× the cap** |
| packed `[u8 len, id, 3 × f32]` | 40,474 | 62% of the JSON |

So the ceiling is around **826 players in one JSON signal**, or **~1,337 packed**. About 80
bytes per record, of which the UUID id is nearly half.

Two things follow. The cap is not a constraint on gameplay — you would need hundreds of
players in a single payload to meet it. And **indentation alone can break it**: the same data,
pretty-printed, is half again over the limit, so always serialise compact.

Size is rarely what hurts anyway; frequency is. A position broadcast at 4 Hz is routine, the
same payload every tick is sixteen times the traffic.

## Three places work is dropped by design

The host never lets a mod stall the simulation, so under pressure it discards rather than
waits. Each is loud in the log.

- **A tick.** `update` is fire-and-forget: a mod still running from last time is skipped, and
  a full command queue (16 deep) drops the call. **Accumulate `dt`; never count ticks.**
- **A signal delivery.** A subscriber whose inbox is full loses *that* signal rather than
  blocking the emitter. Signals are facts, not transactions.
- **Any command, under a slow guest.** The one 16-deep queue carries presses, contact edges
  and ticks alike, so a mod that blocks it delays everyone's.

Player joins are the exception: a join is the only notice a mod ever gets that a player
exists, so joins queue and retry instead of dropping.

## Pacing: a mod runs in slices

A guest is interrupted and forced to yield roughly every 5 ms, so one mod cannot hold the
shared modding thread. A call that needs more time is not cancelled — it resumes on the next
slice.

The consequence worth knowing: **the wall-clock cost of a heavy call depends on how loaded
the machine is**, not only on the work. A one-off like `init` on a busy host can take
noticeably longer than the same call on an idle one. Keep per-tick work small, and do not
treat a slow first frame as a bug in your mod.

## Ordering you can rely on

- **Load and dispatch order is the enabled set's order**, not filesystem order — so `init`
  order is a decision the server made, and it is the same on every peer.
- **Signals arrive per-mod in the order they were emitted**, because one delivery task per mod
  is the only caller of its handler.
- **A signal does not synchronise with the emitter's other work.** "Hear a signal, then read
  the world" is an anti-pattern; put what the receiver needs in the payload.
