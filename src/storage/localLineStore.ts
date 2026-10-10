import type { Line, LineStore } from "../book/lineStore.ts";

const key = "chess-app.lines.v1";

export function localLineStore(): LineStore {
  function readAll(): Line[] {
    return JSON.parse(localStorage.getItem(key) ?? "[]");
  }

  return {
    add(line) {
      localStorage.setItem(key, JSON.stringify([...readAll(), line]));
    },
    readAll,
  };
}
