import { test } from "vitest";
import {
  givenAContext, givenAContextThatCannotBeMade, givenAFileThatDoesNotDecode, givenAFileThatDoesNotLoad, givenASuspendedContext, thenBothFilesAreLoaded,
  thenTheContextIsMadeOnce, thenTheContextIsResumed, thenTheSoundsArePlayed, thenThereIsSilence, whenYouPlay,
} from "./sound.steps.ts";

test("Each sound plays the buffer of its file", async () => {
  const context = givenAContext();
  await whenYouPlay(context, "move", "capture", "move");
  thenTheSoundsArePlayed(context, ["move", "capture", "move"]);
});

test("The first sound loads both files", async () => {
  const context = givenAContext();
  await whenYouPlay(context, "move");
  thenBothFilesAreLoaded(context);
});

test("The context is made one time, and each file is fetched and decoded one time", async () => {
  const context = givenAContext();
  await whenYouPlay(context, "move", "move", "capture", "capture");
  thenTheContextIsMadeOnce(context);
  thenBothFilesAreLoaded(context);
});

test("A suspended context is resumed", async () => {
  const context = givenASuspendedContext();
  await whenYouPlay(context, "move");
  thenTheContextIsResumed(context);
  thenTheSoundsArePlayed(context, ["move"]);
});

test("A context that cannot be made gives silence and no fetch", async () => {
  const context = givenAContextThatCannotBeMade();
  await whenYouPlay(context, "move", "capture");
  thenThereIsSilence(context);
});

test.each([
  ["does not load", givenAFileThatDoesNotLoad], ["does not decode", givenAFileThatDoesNotDecode],
])("A file that %s gives silence, and the next sound tries again", async (_name, given) => {
  const context = given("capture");
  await whenYouPlay(context, "capture");
  thenTheSoundsArePlayed(context, []);
  await whenYouPlay(context, "capture");
  thenTheSoundsArePlayed(context, ["capture"]);
});
