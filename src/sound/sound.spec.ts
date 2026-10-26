import { test } from "vitest";
import {
  givenAContext, givenAContextThatCannotBeMade, givenASuspendedContext, thenTheCaptureIsLouder, thenTheContextIsMadeOnce, thenTheContextIsResumed,
  thenTheSamplesAre, thenTheSamplesAreTheSame, thenTheSoundsArePlayed, thenThereIsSilence, whenYouPlay,
} from "./sound.steps.ts";

test.each([["move", 3840], ["capture", 6720]] as const)("The %s sound has %i samples at 48000 Hz, from -1 to 1, and fades out", (sound, length) =>
  thenTheSamplesAre(sound, 48000, length));
test("The capture sound is louder than the move sound", () => thenTheCaptureIsLouder());
test("The samples are the same at each call", () => thenTheSamplesAreTheSame());

test("Each sound plays a buffer of its samples", () => {
  const context = givenAContext();
  whenYouPlay(context, "move", "capture", "move");
  thenTheSoundsArePlayed(context, ["move", "capture", "move"]);
});

test("The context and each buffer are made one time", () => {
  const context = givenAContext();
  whenYouPlay(context, "move", "move", "capture", "capture");
  thenTheContextIsMadeOnce(context, 2);
});

test("A suspended context is resumed", () => {
  const context = givenASuspendedContext();
  whenYouPlay(context, "move");
  thenTheContextIsResumed(context);
  thenTheSoundsArePlayed(context, ["move"]);
});

test("A context that cannot be made gives silence", () => {
  const context = givenAContextThatCannotBeMade();
  whenYouPlay(context, "move", "capture");
  thenThereIsSilence(context);
});
