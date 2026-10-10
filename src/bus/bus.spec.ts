import { test } from "vitest";
import {
  givenABusWithACommandListenerFor,
  givenABusWithAQueryListenerForEchoThatGivesItsInput,
  givenABusWithCommandListenersForAAndBAndAQueryListenerForLast,
  thenLastGives,
  thenTheCallerGets,
  thenTheCallerGetsTheError,
  whenTheCallerAddsASecondCommandListenerFor,
  whenTheCallerAsksEchoWith,
  whenTheCallerSends,
} from "./bus.steps.ts";

test("A command goes to the listener of its type", () => {
  const testBus = givenABusWithCommandListenersForAAndBAndAQueryListenerForLast();
  whenTheCallerSends(testBus, "B");
  thenLastGives(testBus, "B");
});

test("A query gives the data of its listener", () => {
  const testBus = givenABusWithAQueryListenerForEchoThatGivesItsInput();
  whenTheCallerAsksEchoWith(testBus, 7);
  thenTheCallerGets(testBus, 7);
});

test("A second listener for one type is rejected", () => {
  const testBus = givenABusWithACommandListenerFor("A");
  whenTheCallerAddsASecondCommandListenerFor(testBus, "A");
  thenTheCallerGetsTheError(testBus, "The type A already has a listener.");
});
