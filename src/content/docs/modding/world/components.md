---
title: "Components: reading and writing state"
description: "Typed shortcuts and one general verb over a whitelist of published rows — and today the whitelist has exactly three."
kind: explanation
area: modding
sidebar:
  label: "Components"
  order: 3
---

Entity state is read and written through component rows the host publishes. This page is
the write surface itself; whether a given write is *allowed* is
[the ownership rule](/modding/world/ownership/), and where a handle comes from is
[entities](/modding/world/entities/).

## The whole write surface

**Today exactly three rows are published:**

| Row | Paths | Notes |
|---|---|---|
| `transform` | `translation` (vec3), `rotation` (quat), `scale` (vec3) | physics-aware, see below |
| `material` | `base_color` (rgba) | covers every mesh in the subtree |
| `label` | `text` (text), `offset` (vec3), `max_distance` (number), `fade` (number), `through_walls` (boolean) | world-anchored text, see below |

Anything else — visibility, health, mass, light colour — is not writable from a mod. If
your design needs one, the change is a row in the host's whitelist, never a new verb.
Fields, defaults and per-row properties are on the
[component rows reference](/reference/components/).

The common paths have **typed shortcuts** on `Entity`, so an author never spells a row
name or holds an id for them:

```rust
use ironlark::server::prelude::*;

// Each shortcut writes one field of one published row; the names resolve once
// per session behind the scenes. `Entity`, `Vec3` and `Rgba` arrive with the
// prelude.
async fn dress(panel: &Entity) {
    if let Err(e) = panel.set_translation(Vec3::new(13.0, 1.2, 0.0)).await {
        log::error!("move failed: {e}");
    }
    if let Err(e) = panel.set_label("Teleport").await {
        log::error!("label failed: {e}");
    }
    // A destination is meant to be found, so this label declares itself
    // visible through walls.
    if let Err(e) = panel.set_label_through_walls(true).await {
        log::error!("label visibility failed: {e}");
    }
    let livery = Rgba { r: 0.15, g: 0.75, b: 0.9, a: 1.0 };
    if let Err(e) = panel.set_base_color(livery).await {
        log::error!("recolor failed: {e}");
    }
}
```

`set_translation`, `set_scale`, `set_label`, `set_label_through_walls` and
`set_base_color` are the shortcuts; `translation()` is the matching read. Each call is
one crossing into the host, so two paths of one row are better written as one batch
through the general form.

## The general form: resolve once, write by id

Paths without a shortcut — `rotation`, a label's `offset` — go through `set_component`,
which takes resolved ids so the names are spelled once in `init` and never on a hot
call:

```rust
use ironlark::server::prelude::*;

// `material` is a row the host publishes and `base_color` a path inside it.
// Neither is declared in mod.toml; these two resolve calls are the whole
// origin of both ids. `resolve`, `ComponentId`, `FieldId`, `Field`, `Value`
// and `Rgba` all arrive with the prelude.
ironlark::state! {
    static MATERIAL: Option<ComponentId> = None;
    static BASE_COLOR: Option<FieldId> = None;
}

// Called once, from this mod's `init` hook.
fn learn_the_material_row() {
    let Ok(material) = resolve::component("material") else {
        log::error!("this session publishes no material row");
        return;
    };
    let Ok(base_color) = resolve::field(material, "base_color") else {
        log::error!("the material row has no base_color path");
        return;
    };
    MATERIAL.set(Some(material));
    BASE_COLOR.set(Some(base_color));
}

async fn paint_red(door: &Entity) {
    let Some(material) = MATERIAL.get() else {
        return;
    };
    let Some(base_color) = BASE_COLOR.get() else {
        return;
    };
    let red = Field {
        field: base_color,
        value: Value::Rgba(Rgba { r: 0.9, g: 0.2, b: 0.15, a: 1.0 }),
    };
    if let Err(e) = door.set_component(material, [red]).await {
        log::warn!("the door kept the colour it had: {e}");
    }
}
```

A batch is checked whole before anything is applied, so a refusal leaves the entity
exactly as it was — never half-written. `get_component` is the exact inverse: it answers
one `Field` per id asked for, in the order asked, so a read feeds straight back into a
write.

Values are the closed six-shape vocabulary — number, boolean, text, vec3, quat, rgba.
Every number must be finite; text is capped at 256 bytes, no control characters, at
least one visible character unless empty, refused whole and never truncated.

A write restating the value the entity already holds is **dropped before the wire**, so
recomputing a colour every tick and writing it back costs nothing while it does not
change. (A player's body pose rides its own route and is the exception.)

## `transform` moves physics bodies too

On a physics body, `translation` and `rotation` route to the physics pose rather than
the render transform, so a write genuinely moves the thing instead of fighting the
simulation for a frame. That is what makes teleporting work:

```rust
use ironlark::server::prelude::*;

// Inside a contact handler about this player — the standing to move them is
// the event's own, and it holds for 16 ticks from admission.
async fn send_home(player: SessionId, home: Vec3) {
    let body = match body_of(player).await {
        Ok(body) => body,
        Err(e) => {
            log::warn!("body failed: {e}");
            return;
        }
    };
    if let Err(e) = body.set_translation(home).await {
        log::error!("move failed: {e}");
    }
}
```

`scale` stays on the transform, and only there: the collision proxy that receives a
use-ray or a touch follows position and rotation, **not size**. Scale an interactable up
and it looks bigger while staying pressable over its original volume. A mod whose
collider matters sizes its content at authoring time.

## `material` covers a subtree, and does not bleed

Writing `base_color` on an entity recolours **every mesh beneath it**, which is usually
what you want for "make this thing red". To paint one piece, resolve the authored node
with `part` first and paint what comes back — the panel of a door rather than its frame
and hinges ([parts](/modding/world/entities/)).

Instances spawned from one archetype share their material asset until somebody writes
it. The first write clones the asset for that mesh alone, so recolouring one instance
never tints the others. Unlike `label`, this row is never attached by a write: an entity
with no mesh under it refuses rather than growing one.

## `label` is text over an entity, and it answers to its writer

One `set_label` call puts a line of text over the entity on every peer. There was no
label there before — the row is **attached by its first write**: the host builds the
row's defaults (a readable offset above the entity, a visibility range, a fade band),
applies your field over them, and inserts the result. No declaration, no attach verb.
The empty string is the inert value, and writing it is how the line is taken away.

A label is attributed speech on a shared entity, so the row is **writer-scoped**: while
it holds anything but its defaults, only the mod that wrote it may change it, however
much reach another mod has. Anyone with reach may still write the whole row back to its
defaults — clearing a label is not speaking — and that release frees the row for the
next writer. Two intents, two writes: to **hide** your label while keeping it yours,
write `max_distance` to `0`; to **give the row up**, write the defaults back. When a
possession ends, every claimed row on that body resets to defaults, because afterwards
nothing has the reach to update or clear it; a disabled mod's labels are erased the same
way.

Writing a label on a **player's body** needs one more thing this page does not confer:
the subject event, or the `label` row declared under `body-rows` in your manifest —
[decorating players](/modding/presentation/body-decoration/).

The engine renders labels; a mod never draws. The local player's own label is not shown
to them.

## Writes replicate, reads are gated

A write on a replicated entity reaches every peer over the same path the value took
locally, and is folded into what a late joiner receives — someone arriving after the
recolour sees the recoloured thing. Root motion is the exception: continuous position
and rotation of a replicated root ride the snapshot stream, which is what keeps movement
smooth.

`get_component` is gated exactly like `set_component`, with reads narrower in two ways —
a grant must name `read`, and the decoration path never opens a read at all. The whole
rule, including the 16-tick standing an event confers over a body, is on
[who may act on an entity](/modding/world/ownership/).
