---
title: "Limits and pacing"
description: "The real numbers, and the places the host drops or refuses a mod's work on purpose rather than stalling the world."
kind: reference
area: modding
sidebar:
  order: 40
---

Every cap here is deliberate, and every refusal names the number it broke. The
vocabulary is [the glossary's](/glossary/); how work reaches a mod at all is
[Realms and lifecycle](/modding/lifecycle/).

## Caps

| Limit | Value | What happens past it |
|---|---|---|
| Signal payload | 64 KiB | the raise is refused, with the cap in the answer |
| Raises per mod, per tick, per bus | 16 | further raises this tick are refused; raise again next tick |
| Per-mod signal inbox | 64 deliveries | a delivery to the full inbox is shed, loudly |
| Raises held while a realm's mods still load | 256 | the raise is refused |
| A signal name | 256 bytes | the name is refused |
| A request's payload, and its answer | 64 KiB each | refused, with the cap in the answer |
| Requests queued per mod | 32 | the arriving request is answered with a refusal instead of queued |
| Presses and touches queued per mod | 64 | stale presses are shed first; a still-queued touch pair is cancelled whole |
| Joins and leaves queued per mod | 32 | never shed — a mod that far behind is failed instead |
| Input edges queued per client half | 8 | the arriving edge is shed rather than delivering a stale burst |
| Events served between two ticks | 8 | the tick jumps the queue, so motion keeps integrating |
| An event's authority over its player | 16 ticks | the event still delivers, but no longer lets the mod act on that player's body |
| Memory per mod | 128 MiB by default; the operator raises or lowers it | growth past it ends the call and takes the mod out for the session — see below |
| Guest execution in one call | 400 slices of ~5 ms | the call is ended and the mod restarted — see below |
| Use-presses per player | 1 per 100 ms | the excess never reaches the mod |
| A host call's answer | within 10 s | the call returns an error instead of waiting forever |
| `find` results | 1024 | the list is capped |
| Overlay text | 128 characters | the line is cut |
| Interact reach | 3.0 m from the body | the press does not resolve |
| Character step-up | 0.3 m | taller ledges block movement |

The memory ceiling applies to your linear memory and your language runtime's
garbage-collected heap separately, so a mod that ships an interpreter pays for
both. It is `[limits] memory_mb` in
[the server's configuration](/server/configuration/), so a heavy scripting mod
and a small container are both real deployments.

Size is rarely what hurts; frequency is. A payload raised at 4 Hz is routine;
the same payload every tick is many times the traffic, and the 16-raise tick
budget is what turns an accidental raise-per-tick-per-player loop into a typed
refusal instead of a saturated bus.

## Every mod has its own lanes, and each sheds by what it carries

Each mod has its own bounded mailbox, one lane per kind of work: one mod
falling behind costs nobody else anything. Under pressure the host discards
rather than waits, and what it discards depends on what the work means. Every
shed is loud in the log.

- **A tick is replaced, never queued.** A mod still busy when the next tick
  lands keeps only the newest. Accumulate `dt`; never count ticks.
- **A press is shed before a touch edge.** A lost press costs one player one
  retry; a lost touch edge would corrupt paired `on_contact` state forever, so
  the host cancels a *whole* still-queued pair — you hear neither half, and
  your count stays right — before it would ever lose one half.
- **A signal delivery is shed whole.** A subscriber whose inbox is full loses
  *that* delivery rather than blocking the raiser. Signals are facts, not
  transactions. A name declared with `keep = NEWEST` goes further: a newer
  raise supersedes an older one by design (see
  [The protocol schema](/modding/mod/protocol-schema/)).
- **Joins and leaves are never shed.** A join is the only notice a mod gets
  that a player exists. A mod so far behind that even that lane is full is
  failed and restarted instead — see below.
- **After 8 served events, the tick jumps the queue.** A mod saturated with
  events must still integrate time, or its entities freeze while its handlers
  keep firing.
- **Authority goes stale at 16 ticks.** A routed event delivered late still
  arrives — your bookkeeping needs it — but past 16 ticks it no longer confers
  the right to act on that player's body. See
  [Ownership](/modding/world/ownership/).

## Pacing: a mod runs in slices, and a call has a budget

A guest is interrupted and forced to yield roughly every 5 ms, so one mod
cannot hold the shared modding thread. An ordinary call never notices; a heavy
one resumes on the next slice — up to **400 slices in one call**, after which
the call is ended and the mod restarted. That is roughly two seconds of pure
guest execution: far above any legitimate handler, and exactly where an
accidental infinite loop ends up.

The consequence worth knowing: the wall-clock cost of a heavy call depends on
how loaded the machine is, not only on the work. A one-off like `init` on a
busy host can take noticeably longer than the same call on an idle one. Keep
per-tick work small, and do not treat a slow first frame as a bug in your mod.

## When your mod is killed, and what a restart means

A mod that breaks its bounds — a call past its budget, memory past the
ceiling, a trap, a panic — is stopped and named in the server log, and every
other mod keeps running. The first time, the host restarts it with a fresh
instance:

- your entities are despawned first, so your `init` can spawn them again
  without doubling;
- `init` runs again, and `on_join` is replayed for every player who was
  present when the old instance died and still is — treat a replayed join as
  current, because for your fresh instance it is;
- anything you kept only in memory is gone.

The second failure, or any memory-ceiling kill — a fresh instance would hit
the same ceiling — takes the mod out for the rest of the session.

One edge worth coding for: a player can leave while your mod is restarting, so
`on_leave` may name a player your fresh instance never saw join. Treat it as a
no-op.

## Ordering you can rely on

- **Load order, and so `init` order, is the enabled set's order** — derived
  from dependencies, the same on every peer. See
  [Dependencies](/modding/mod/dependencies/).
- **Deliveries to one mod arrive in raise order**, because one delivery task
  per mod is the only caller of its handlers.
- **A signal does not synchronize with the raiser's other work.** "Hear a
  signal, then read the world" is an anti-pattern; the payload carries
  everything the receiver needs. See
  [Signals](/modding/messaging/signals/).
