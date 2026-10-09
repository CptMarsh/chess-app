export type Side = "white" | "black";

export function sideName(side: Side) {
  return side === "white" ? "White" : "Black";
}

export function bySide<T>(make: () => T): Record<Side, T> {
  return { white: make(), black: make() };
}
