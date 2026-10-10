import type { Line, LineStore } from "../book/lineStore.ts";

export function memoryLineStore(): LineStore {
  const lines: Line[] = [];
  return {
    add(line) {
      lines.push(line);
    },
    readAll: () => lines,
  };
}
