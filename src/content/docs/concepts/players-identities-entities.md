---
title: "Players, Identities & Entities"
sidebar:
  order: 10
---

Ironlark keeps **who you are** separate from **what you're controlling**. That split is
the foundation everything else builds on — spectators, respawns, alt-characters,
NPCs, vehicles, hidden roles. This page explains the model.

:::note[Note]
The *model* here is settled and engine-level (mods can't change it). The exact
modding API for working with it is still being implemented — treat the function
names below as illustrative, not final.
:::

## The four pieces

| Concept | What it is | In one line |
|---|---|---|
| **Player** | The authenticated account — the human at the keyboard. | *Who is connected.* |
| **Identity** | A persona a player plays as (name, team, stats, saves). | *Who you are in the world.* |
| **Entity** | A controllable thing in the world — usually a character body, but also a vehicle, turret, or prop. | *What exists in the world.* |
| **Controller** | What drives an entity: a **player**, or an **AI**. | *What's steering.* |

And one relationship that ties them together:

- **Control** — a *controller* drives an *entity*. It's a separate, **transferable**
  link, not something baked into the entity.

### How they relate

- A **player** can own **several identities**, with **one active** at a time
  (your current character).
- Only **players** have identities. An **AI** is a controller too, but it has no
  identity.
- A player (or AI) **controls** an entity. A player can control more than one, but
  usually controls one.
- A controlled entity reads its identity **through its controller** — so when a
  player drives a character, everyone can see that character's name and team. The
  identity isn't stored on the entity; it's read from whoever controls it.

```
Player ──owns──> Identity (×N, one active)
  │
  └──controls──> Entity        (control is transferable)
AI  ──controls──> Entity
```

## Control: who drives what

Creating an entity and controlling it are **two separate steps**. That's what makes
these possible:

- **Enter a vehicle** — your control moves from your character to the car; your
  character parks.
- **Take over an NPC or turret** — control hands off from the AI to you.
- **Switch characters** — release one, control another.
- **Spectate** — be a player with an active identity but control *nothing*.

Conceptually:

```text
control(controller, entity)   // start driving it
release(entity)               // stop; it can be taken over (e.g. by AI)
```

## What an identity is (structure)

An identity is a small, structured record — modeled on an [Ory Kratos][kratos]
identity:

- **Required fields** the engine always needs: a stable id, the owning player,
  whether it's active, and a display name.
- **Optional fields** the engine understands but doesn't require.
- **Traits** — open key/values that **mods read and write**. Traits are namespaced
  per mod, so two mods never clash. Each trait has a **visibility**:

| Visibility | Who can see it (on clients) | Use for |
|---|---|---|
| `public` | everyone | name, team, color |
| `owner-only` | just that player (and the server) | a secret role you know but others don't |
| `server-only` | nobody — host only | anti-cheat flags, hidden mechanics |

The **server always knows every trait**; visibility only limits what is sent to
other players' clients. (Admins can read private/server-only traits through a
server-side API.)

## What you can do with an identity

- **Read and write traits** — set a team, assign a role, change the display name.
- **Store gameplay state two ways**, choosing per piece of data:
  - **In identity traits** (*host-managed*) — the engine replicates them by
    visibility and persists them with the identity. Best for things other mods or
    clients should see (team, level, title).
  - **In your mod's own storage** (*mod-managed*) — you serialize and keep it
    yourself. Best for private, bulky, or mod-specific state.
- **Look things up** — which identity is driving a given entity, or which
  entities a player is controlling.

```text
set_trait(identity, "team", "red", public)
set_trait(identity, "role", "murderer", owner-only)   // only that player sees it
get_trait(identity, "team")
```

## Three kinds of "death"

Because the layers are separate, "death" means different things — and a gamemode
picks which one it wants:

| What ends | What survives | Typical use |
|---|---|---|
| **Entity destroyed** | the player and identity | respawn (deathmatch) |
| **Identity destroyed** | the player | permadeath of a character (RP) — pick or make a new one |
| **Player disconnects** | identities (saved) | log back in later, personas intact |

## What this enables

- **Alt-characters** — one player, several identities, each with its own stats and
  saves (roleplay servers).
- **Spectators & lobbies** — an identity with no controlled entity.
- **NPCs** — an AI-controlled entity with no identity.
- **Possession** — hop into vehicles, take over turrets or NPCs.
- **Hidden roles** — an `owner-only` trait the murderer sees but no one else does.
- **Persistent progression** — level and unlocks ride on the identity.

## See also

- [Gamemodes](/guides/gamemodes/) — gamemodes decide *when* to spawn, control, and
  retire entities and identities.

[kratos]: https://www.ory.sh/kratos/
