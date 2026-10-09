import type { Side } from "../events.ts";

export function readSide(orientation: string | undefined): Side | undefined {
  const side = orientation?.toLowerCase();
  return side === "white" || side === "black" ? side : undefined;
}
