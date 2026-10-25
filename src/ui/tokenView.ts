import type { TokenStore } from "../token/token.ts";
import "./token.css";

export function mountTokenDialog(root: HTMLElement, tokens: Pick<TokenStore, "read" | "save">): () => void {
  root.insertAdjacentHTML("beforeend", `
    <dialog id="tokenDialog">
      <form method="dialog">
        <p>
          The app gets the moves of other players from Lichess. Lichess asks for a personal token.
          Make one at <a href="https://lichess.org/account/oauth/token" target="_blank" rel="noopener">lichess.org/account/oauth/token</a>.
          It needs no scopes. The app keeps the token only in this browser.
        </p>
        <label>Lichess token <input id="tokenField" type="password" autocomplete="off" spellcheck="false"></label>
        <p id="tokenError"></p>
        <div id="tokenButtons">
          <button type="button" id="tokenCancel">Cancel</button>
          <button id="tokenSave">Save</button>
        </div>
      </form>
    </dialog>
  `);
  const dialog = root.querySelector<HTMLDialogElement>("#tokenDialog")!;
  const form = dialog.querySelector("form")!;
  const field = dialog.querySelector<HTMLInputElement>("#tokenField")!;
  const error = dialog.querySelector<HTMLElement>("#tokenError")!;
  const cancel = dialog.querySelector<HTMLButtonElement>("#tokenCancel")!;

  form.addEventListener("submit", (event) => {
    try {
      tokens.save(field.value);
    } catch (problem) {
      event.preventDefault();
      error.textContent = problem instanceof Error ? problem.message : String(problem);
    }
  });

  cancel.addEventListener("click", () => dialog.close());

  // Without a token, Escape does not close the dialog.
  dialog.addEventListener("cancel", (event) => {
    if (tokens.read() === "") event.preventDefault();
  });

  return () => {
    field.value = "";
    error.textContent = "";
    cancel.hidden = tokens.read() === "";
    dialog.showModal();
  };
}
