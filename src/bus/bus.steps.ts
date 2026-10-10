import { expect } from "vitest";
import { createBus, type Bus } from "./bus.ts";

type TestCommand = { type: "A" } | { type: "B" };
type TestQuery = { type: "Last" } | { type: "Echo"; value: number };
type TestAnswers = { Last: string; Echo: number };

type TestBus = { bus: Bus<TestCommand, TestQuery, TestAnswers>; answer?: unknown; error?: unknown };

function emptyBus(): TestBus {
  return { bus: createBus<TestCommand, TestQuery, TestAnswers>() };
}

export function givenABusWithCommandListenersForAAndBAndAQueryListenerForLast() {
  const testBus = emptyBus();
  let last = "";
  testBus.bus.onCommand("A", () => {
    last = "A";
  });
  testBus.bus.onCommand("B", () => {
    last = "B";
  });
  testBus.bus.onQuery("Last", () => last);
  return testBus;
}

export function givenABusWithAQueryListenerForEchoThatGivesItsInput() {
  const testBus = emptyBus();
  testBus.bus.onQuery("Echo", (query) => query.value);
  return testBus;
}

export function givenABusWithACommandListenerFor(type: TestCommand["type"]) {
  const testBus = emptyBus();
  testBus.bus.onCommand(type, () => {});
  return testBus;
}

export function whenTheCallerSends(testBus: TestBus, type: TestCommand["type"]) {
  testBus.bus.send({ type });
}

export function whenTheCallerAsksEchoWith(testBus: TestBus, value: number) {
  testBus.answer = testBus.bus.ask({ type: "Echo", value });
}

export function whenTheCallerAddsASecondCommandListenerFor(testBus: TestBus, type: TestCommand["type"]) {
  try {
    testBus.bus.onCommand(type, () => {});
  } catch (error) {
    testBus.error = error;
  }
}

export function thenLastGives(testBus: TestBus, type: TestCommand["type"]) {
  expect(testBus.bus.ask({ type: "Last" })).toBe(type);
}

export function thenTheCallerGets(testBus: TestBus, value: number) {
  expect(testBus.answer).toBe(value);
}

export function thenTheCallerGetsTheError(testBus: TestBus, message: string) {
  expect(testBus.error).toEqual(new Error(message));
}
