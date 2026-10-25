import { expect } from "vitest";
import { TokenStore } from "./token.ts";

type TestStore = { store: TokenStore; items: Map<string, string> };

function storageOf(items: Map<string, string>, refuseWrites = false): Storage {
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => {
      if (refuseWrites) throw new DOMException("The quota has been exceeded.", "QuotaExceededError");
      items.set(key, value);
    },
  } as Storage;
}

export function givenAStorageWith(token: string | null): TestStore {
  const items = new Map<string, string>(token === null ? [] : [["lichessToken", token]]);
  return { store: new TokenStore(() => storageOf(items)), items };
}

export function givenABlockedStorage(): TestStore {
  return { store: new TokenStore(() => { throw new DOMException("Access is denied.", "SecurityError"); }), items: new Map() };
}

export function givenAStorageThatRefusesWrites(): TestStore {
  const items = new Map<string, string>();
  return { store: new TokenStore(() => storageOf(items, true)), items };
}

export function whenYouSave(test: TestStore, text: string) {
  test.store.save(text);
}

export function thenTheTokenIs(test: TestStore, token: string) {
  expect(test.store.read()).toBe(token);
}

export function thenTheStoredTokenIs(test: TestStore, token: string) {
  expect(test.items.get("lichessToken")).toBe(token);
}

export function thenSavingThrows(test: TestStore, text: string, message: string) {
  expect(() => test.store.save(text)).toThrow(message);
}
