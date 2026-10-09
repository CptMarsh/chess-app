import type { BookApi } from "../api/bookApi.ts";

const timeLimitMs = 5_000;
const waitMs = 50;

function lineCount(name: string, count: number) {
  return `${name}: ${count} ${count === 1 ? "line" : "lines"}`;
}

export function mountBookInput(root: HTMLElement, api: BookApi) {
  const pgn = document.createElement("textarea");
  const save = document.createElement("button");
  const white = document.createElement("p");
  const black = document.createElement("p");
  const message = document.createElement("p");
  save.textContent = "Save";
  root.append(pgn, save, white, black, message);

  function showSummary() {
    const { body } = api.getSummary();
    white.textContent = lineCount("White", body.white);
    black.textContent = lineCount("Black", body.black);
  }

  async function waitForResult(commandId: string) {
    const end = Date.now() + timeLimitMs;
    let response = api.getCommandStatus(commandId);
    while (response.status === 202 && Date.now() < end) {
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      response = api.getCommandStatus(commandId);
    }
    return response;
  }

  save.addEventListener("click", async () => {
    message.textContent = "";
    const sent = api.sendCommand({ type: "AddPgn", pgn: pgn.value });
    if (!("commandId" in sent.body)) {
      message.textContent = sent.body.message;
      return;
    }
    const result = await waitForResult(sent.body.commandId);
    if (result.status === 201) showSummary();
    else if ("message" in result.body) message.textContent = result.body.message;
    else message.textContent = "The book did not answer in time.";
  });

  showSummary();
}
