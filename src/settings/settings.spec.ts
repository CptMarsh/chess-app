import { test } from "vitest";
import {
  givenABlockedStorage, givenAStorageThatRefusesWrites, givenAStorageWith, thenTheLineIs, thenTheSettingsAre, thenTheSoundIs, thenTheStoredLineIs,
  thenTheStoredSettingsAre, thenTheStoredSoundIs, whenYouSave, whenYouSaveTheLine, whenYouSaveTheSound,
} from "./settings.steps.ts";

test("The stored source and username are read", () => {
  const store = givenAStorageWith({ replySource: "chessCom", chessComUsername: "Magnus" });
  thenTheSettingsAre(store, "chessCom", "Magnus");
});

test("No stored settings give Lichess and an empty username", () => {
  const store = givenAStorageWith({});
  thenTheSettingsAre(store, "lichess", "");
});

test("A wrong stored source gives Lichess", () => {
  const store = givenAStorageWith({ replySource: "fide" });
  thenTheSettingsAre(store, "lichess", "");
});

test("A blocked storage gives Lichess and an empty username", () => {
  const store = givenABlockedStorage();
  thenTheSettingsAre(store, "lichess", "");
});

test("Saved settings lose the spaces of the username and are written", () => {
  const store = givenAStorageWith({});
  whenYouSave(store, "chessCom", "  Magnus \n");
  thenTheSettingsAre(store, "chessCom", "Magnus");
  thenTheStoredSettingsAre(store, "chessCom", "Magnus");
});

test("A refused write keeps the settings in memory", () => {
  const store = givenAStorageThatRefusesWrites();
  whenYouSave(store, "chessCom", "Magnus");
  thenTheSettingsAre(store, "chessCom", "Magnus");
});

test("A blocked storage keeps saved settings in memory", () => {
  const store = givenABlockedStorage();
  whenYouSave(store, "chessCom", "Magnus");
  thenTheSettingsAre(store, "chessCom", "Magnus");
});

test.each([[{}, true], [{ pieceSound: "on" }, true], [{ pieceSound: "loud" }, true], [{ pieceSound: "off" }, false]])(
  "The stored sound %j gives %s", (stored, on) => thenTheSoundIs(givenAStorageWith(stored), on));

test("A blocked storage gives the sound on", () => thenTheSoundIs(givenABlockedStorage(), true));

test.each([[false, "off"], [true, "on"]])("A saved sound %s is written as %s", (on, value) => {
  const store = givenAStorageWith({});
  whenYouSaveTheSound(store, on);
  thenTheSoundIs(store, on);
  thenTheStoredSoundIs(store, value);
});

test("A refused write keeps the sound in memory", () => {
  const store = givenAStorageThatRefusesWrites();
  whenYouSaveTheSound(store, false);
  thenTheSoundIs(store, false);
});

const LINE = { rating: "1450", color: "black", moves: "5" } as const;

test("No stored line settings give null", () => thenTheLineIs(givenAStorageWith({}), null));

test("The stored line settings are read", () => thenTheLineIs(givenAStorageWith({ lineSettings: JSON.stringify(LINE) }), LINE));

test.each(["not json", "null", "[]", '{"rating":"1450"}', '{"rating":"1450","color":"red","moves":"5"}', '{"rating":1450,"color":"white","moves":"5"}'])(
  "The stored line settings %j give null", (text) => thenTheLineIs(givenAStorageWith({ lineSettings: text }), null));

test("A blocked storage gives no line settings", () => thenTheLineIs(givenABlockedStorage(), null));

test("Saved line settings are written", () => {
  const store = givenAStorageWith({});
  whenYouSaveTheLine(store, LINE);
  thenTheLineIs(store, LINE);
  thenTheStoredLineIs(store, JSON.stringify(LINE));
});

test("A refused write keeps the line settings in memory", () => {
  const store = givenAStorageThatRefusesWrites();
  whenYouSaveTheLine(store, LINE);
  thenTheLineIs(store, LINE);
});
