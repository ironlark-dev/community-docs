---
kind: reference
area: build
title: "Limits and pacing"
description: "The real numbers, and the three places the host drops your work on purpose rather than stalling the world."
sidebar:
  order: 90
---

## Caps

| Limit | Value | What happens past it |
|---|---|---|
| `find` / `overlap` results | 1024 | the list is capped |
| Signal channel name | 256 bytes | `emit`/`subscribe` returns an error |
| Signal payload | 64 KiB | `emit` returns an error |
| Per-mod signal inbox | 64 pending | that delivery is shed, loudly |
| Signals queued before mods finish loading | 256 | `emit` returns an error |
| Memory per mod | 128 MiB by default; the operator can raise or lower it | growth past it ends the call and takes your mod out for the session — see below |
| Guest execution per call | 400 slices of ~5 ms | the call is ended and your mod restarted — see below |
| Presses and touches queued per mod | 64 | stale presses are shed first; a whole touch pair is cancelled before either half is lost |
| RPCs queued per mod | 32 | the caller is answered "overloaded" |
| Use-presses per player | 1 per 100 ms | the excess never reaches your mod |
| A host call's answer | within 10 s | the call returns an error instead of waiting forever |
| Overlay text | 128 characters | the line is cut |
| Interact reach | 3.0 m from the body | the press does not resolve |
| Character step-up | 0.3 m | taller ledges block movement |

The memory ceiling applies to your linear memory and your language runtime's
garbage-collected heap separately, so a mod that ships an interpreter pays for
both. It is `[limits] memory_mb` in the server's configuration, so a heavy
scripting pack and a small container are both real deployments.

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

## Every mod has its own queue, and it sheds by what it carries

Each mod has its own bounded mailbox: one mod falling behind costs nobody else
anything. Under pressure the host discards rather than waits, and what it
discards depends on what the work means. Each shed is loud in the log.

- **A tick is replaced, never queued.** A mod still busy when the next tick
  lands keeps only the newest. **Accumulate `dt`; never count ticks.**
- **A press is shed before a touch edge.** A lost press costs one player one
  retry; a lost touch edge would corrupt your paired `on-contact` state
  forever, so the host cancels a *whole* still-queued pair — you never hear
  either half, and your count stays right — before it would ever lose one half.
- **A signal delivery is shed whole.** A subscriber whose inbox is full loses
  *that* signal rather than blocking the emitter. Signals are facts, not
  transactions.

Player joins are the exception: a join is the only notice a mod ever gets that a player
exists, so joins are never shed. A mod so far behind that even a join cannot be queued
is restarted instead — see below.

## Pacing: a mod runs in slices, and a call has a budget

A guest is interrupted and forced to yield roughly every 5 ms, so one mod cannot hold the
shared modding thread. An ordinary call never notices; a heavy one resumes on the next
slice — up to **400 slices in one call**, after which the call is ended and the mod
restarted. That is roughly two seconds of pure guest execution: far above any legitimate
handler, and exactly where an accidental `loop` ends up.

The consequence worth knowing: **the wall-clock cost of a heavy call depends on how loaded
the machine is**, not only on the work. A one-off like `init` on a busy host can take
noticeably longer than the same call on an idle one. Keep per-tick work small, and do not
treat a slow first frame as a bug in your mod.

## When your mod is killed, and what a restart means

A mod that breaks its bounds — a call past its budget, memory past the ceiling, a trap,
a panic — is stopped and named in the server log, and every other mod keeps running.
The first time, the host restarts it with a fresh instance:

- your entities are despawned first, so your `init` can spawn them again without
  doubling;
- `init` runs again, and `on-player-join` is replayed for every player already present —
  treat a replayed join as current, because for your fresh instance it is;
- anything you kept only in memory is gone.

The second failure, or any memory-ceiling kill — a fresh instance would hit the same
ceiling — takes the mod out for the rest of the session.

One edge worth coding for: a player can leave while your mod is restarting, so
`on-player-leave` may name a player your fresh instance never saw join. Treat it as a
no-op.

## Ordering you can rely on

- **Load and dispatch order is the enabled set's order**, not filesystem order — so `init`
  order is a decision the server made, and it is the same on every peer.
- **Signals arrive per-mod in the order they were emitted**, because one delivery task per mod
  is the only caller of its handler.
- **A signal does not synchronise with the emitter's other work.** "Hear a signal, then read
  the world" is an anti-pattern; put what the receiver needs in the payload.
