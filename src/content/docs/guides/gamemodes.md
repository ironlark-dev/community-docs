---
title: "Gamemodes"
sidebar:
  badge:
    text: "Draft"
    variant: "caution"
  order: 30
---

:::caution[Work in progress]
The gamemode and body/control model is being designed; this page will fill in as
it lands.
:::

A **gamemode** is the single mod designated as a session's baseline ruleset —
free-roam, deathmatch, hide & seek, and so on. Mechanically it is just a mod; the
designation is a label. The default is a bundled free-roam gamemode, so a bare
server is playable with no setup.

A gamemode owns session rules: who spawns, when, and where; rounds and phases;
win conditions; teams. Other mods layer on top and can override even the
gamemode's behavior.
