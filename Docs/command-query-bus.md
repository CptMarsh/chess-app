---
type: component
title: Command and query bus
description: A synchronous router that sends each command and each query to the one handler of its message class.
resource: src/bus/bus.ts
tags: [cqrs, bus]
---

# Command and query bus

The bus is the only entry point for callers. It does not know about chess.

Commands and queries are classes. A query class extends `Query<Answer>`, which gives the type of its answer. A handler is a class that implements `CommandHandler<C>` or `QueryHandler<Q>`. It gets its dependencies in its constructor.

| Method | Result |
|---|---|
| `onCommand(CommandClass, handler)` | Attaches the handler for a command class. |
| `onQuery(QueryClass, handler)` | Attaches the handler for a query class. |
| `send(command)` | Runs the `handle` method of the handler of the command class, then gives `{ commandId }`. |
| `ask(query)` | Runs the `handle` method of the handler of the query class and gives its answer. |

## Rules
- Each class has one handler. A second handler throws `The type <class name> already has a listener.`
- `send` and `ask` are synchronous. When `send` gives the acknowledgement, the command is complete.
- A command gives only an acknowledgement. To see the result, ask a query.
- If a handler throws, the error goes out of `send` to the caller.
- Handlers must not call `send`.
- The bus finds the handler by the constructor of the message. Thus there are no type strings.
- `Bus<C, Q>` has the command and query classes as type arguments. The compiler rejects a message of a different class, a handler for a different class, and an answer of the wrong type.

## Related
- [Opening book](opening-book.md) attaches its handlers to the bus.
