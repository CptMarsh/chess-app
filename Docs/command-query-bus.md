---
type: component
title: Command and query bus
description: A synchronous router that sends each command and each query to the one listener of its type.
resource: src/bus/bus.ts
tags: [cqrs, bus]
---

# Command and query bus

The bus is the only entry point for callers. It does not know about chess.

| Function | Result |
|---|---|
| `onCommand(type, listener)` | Attaches the listener for a command type. |
| `onQuery(type, listener)` | Attaches the listener for a query type. |
| `send(command)` | Runs the listener of the command type, then gives `{ commandId }`. |
| `ask(query)` | Runs the listener of the query type and gives its data. |

## Rules
- Each type has one listener. A second listener throws `The type <type> already has a listener.`
- `send` and `ask` are synchronous. When `send` gives the acknowledgement, the command is complete.
- A command gives only an acknowledgement. To see the result, ask a query.
- If a listener throws, the error goes out of `send` to the caller.
- Listeners must not call `send`.
- Command and query types are TypeScript unions with a `type` field. The compiler rejects an unknown type.

## Related
- [Opening book](opening-book.md) attaches its listeners to the bus.
