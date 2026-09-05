---
kind: reference
area: reference
title: "log"
description: "A mod's own log lines: five levels, host-stamped attribution, a length cap and a per-call budget."
sidebar:
  order: 60
---

Part of the host contract in [`host.wit`](/host.wit). One function writes a
line into the host's log, attributed to the writing mod. The attribution comes
from host state, not from the message, so it cannot be spoofed or omitted and
a chain of several mods stays readable.

Imported by both worlds: `server-mod` and `client-mod`.

## `log`

```wit
enum level { trace, debug, info, warn, error }
```

```wit
log: func(lvl: level, msg: string);
```

Writes `msg` at `lvl` under the mod's own id. The function returns nothing, so
its limits act on the output rather than refusing the call:

- A message is capped at 8 KiB. A longer one is cut at the cap, and the host
  writes its own error line naming the mod and the original length.
- One call into a mod may write 64 lines. The budget's death leaves one loud
  host line behind; the rest of that call's output is dropped, never silently
  swallowed.

## Related

- [Troubleshooting](/modding/troubleshooting/) — reading the host log
- [Limits](/modding/limits/) — every cap a mod runs under
