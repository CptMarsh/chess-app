import { expect } from "vitest";
import { Bus, Query } from "./bus.ts";

class A {}

class B {}

const commands = { A, B };

type CommandName = keyof typeof commands;

class Last extends Query<string> {}

class Echo extends Query<number> {
  readonly value: number;

  constructor(value: number) {
    super();
    this.value = value;
  }
}

type TestBus = { bus: Bus<A | B, Last | Echo>; answer?: unknown; error?: unknown };

function emptyBus(): TestBus {
  return { bus: new Bus<A | B, Last | Echo>() };
}

export function givenABusWithCommandListenersForAAndBAndAQueryListenerForLast() {
  const testBus = emptyBus();
  let last = "";
  testBus.bus.onCommand(A, {
    handle() {
      last = "A";
    },
  });
  testBus.bus.onCommand(B, {
    handle() {
      last = "B";
    },
  });
  testBus.bus.onQuery(Last, { handle: () => last });
  return testBus;
}

export function givenABusWithAQueryListenerForEchoThatGivesItsInput() {
  const testBus = emptyBus();
  testBus.bus.onQuery(Echo, { handle: (query) => query.value });
  return testBus;
}

export function givenABusWithACommandListenerFor(name: CommandName) {
  const testBus = emptyBus();
  testBus.bus.onCommand(commands[name], { handle() {} });
  return testBus;
}

export function whenTheCallerSends(testBus: TestBus, name: CommandName) {
  testBus.bus.send(new commands[name]());
}

export function whenTheCallerAsksEchoWith(testBus: TestBus, value: number) {
  testBus.answer = testBus.bus.ask(new Echo(value));
}

export function whenTheCallerAddsASecondCommandListenerFor(testBus: TestBus, name: CommandName) {
  try {
    testBus.bus.onCommand(commands[name], { handle() {} });
  } catch (error) {
    testBus.error = error;
  }
}

export function thenLastGives(testBus: TestBus, name: CommandName) {
  expect(testBus.bus.ask(new Last())).toBe(name);
}

export function thenTheCallerGets(testBus: TestBus, value: number) {
  expect(testBus.answer).toBe(value);
}

export function thenTheCallerGetsTheError(testBus: TestBus, message: string) {
  expect(testBus.error).toEqual(new Error(message));
}
