import { expect } from "vitest";
import { SettingsStore, type Settings } from "./settings.ts";

type TestStore = { store: SettingsStore; items: Map<string, string> };

function storageOf(items: Map<string, string>, refuseWrites = false): Storage {
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => {
      if (refuseWrites) throw new DOMException("The quota has been exceeded.", "QuotaExceededError");
      items.set(key, value);
    },
  } as Storage;
}

export function givenAStorageWith(text: string | null): TestStore {
  const items = new Map<string, string>(text === null ? [] : [["settings", text]]);
  return { store: new SettingsStore(() => storageOf(items)), items };
}

export function givenABlockedStorage(): TestStore {
  return { store: new SettingsStore(() => { throw new DOMException("Access is denied.", "SecurityError"); }), items: new Map() };
}

export function givenAStorageThatRefusesWrites(): TestStore {
  const items = new Map<string, string>();
  return { store: new SettingsStore(() => storageOf(items, true)), items };
}

export function whenYouSave(test: TestStore, settings: Settings) {
  test.store.save(settings);
}

export function thenTheSettingsAre(test: TestStore, settings: Settings | null) {
  expect(test.store.read()).toEqual(settings);
}

export function thenTheStoredTextIs(test: TestStore, text: string) {
  expect(test.items.get("settings")).toBe(text);
}
