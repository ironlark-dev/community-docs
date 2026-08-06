---
title: "Interface reference"
linkTitle: "Interface reference"
weight: 40
description: >
  Every function the host exposes to a mod, and every function a mod
  must export.
---

Generated from `host.wit`, the contract a mod compiles against — so a page here says
what the running host actually offers, not what it offered when someone last wrote
about it. A mod vendors a copy of that file; when a page and your copy disagree,
your copy is stale.

An interface is *imported* (the host offers it, a mod calls it) or *exported* (the mod
must implement it, the host calls it). `server-api` and `client-api` are exported;
everything else is imported.

- [`server-api`](server-api/)
- [`client-api`](client-api/)
- [`entity`](entity/)
- [`spatial`](spatial/)
- [`signal`](signal/)
- [`broadcast`](broadcast/)
- [`rpc-out`](rpc-out/)
- [`map-api`](map-api/)
- [`gamemode`](gamemode/)
- [`ui`](ui/)
- [`log`](log/)
