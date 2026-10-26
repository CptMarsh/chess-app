import { expect } from "vitest";
import { SettingsStore, type LineSettings, type Source } from "./settings.ts";

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

export function givenAStorageWith(stored: Record<string, string>): TestStore {
  const items = new Map(Object.entries(stored));
  return { store: new SettingsStore(() => storageOf(items)), items };
}

export function givenABlockedStorage(): TestStore {
  return { store: new SettingsStore(() => { throw new DOMException("Access is denied.", "SecurityError"); }), items: new Map() };
}

export function givenAStorageThatRefusesWrites(): TestStore {
  const items = new Map<string, string>();
  return { store: new SettingsStore(() => storageOf(items, true)), items };
}

export function whenYouSave(test: TestStore, source: Source, username: string) {
  test.store.save(source, username);
}

export function thenTheSettingsAre(test: TestStore, source: Source, username: string) {
  expect(test.store.source()).toBe(source);
  expect(test.store.username()).toBe(username);
}

export function thenTheStoredSettingsAre(test: TestStore, source: Source, username: string) {
  expect(test.items.get("replySource")).toBe(source);
  expect(test.items.get("chessComUsername")).toBe(username);
}

export function whenYouSaveTheSound(test: TestStore, on: boolean) {
  test.store.saveSound(on);
}

export function thenTheSoundIs(test: TestStore, on: boolean) {
  expect(test.store.sound()).toBe(on);
}

export function thenTheStoredSoundIs(test: TestStore, value: string) {
  expect(test.items.get("pieceSound")).toBe(value);
}

export function whenYouSaveTheLine(test: TestStore, line: LineSettings) {
  test.store.saveLine(line);
}

export function thenTheLineIs(test: TestStore, line: LineSettings | null) {
  expect(test.store.line()).toEqual(line);
}

export function thenTheStoredLineIs(test: TestStore, text: string) {
  expect(test.items.get("lineSettings")).toBe(text);
}
