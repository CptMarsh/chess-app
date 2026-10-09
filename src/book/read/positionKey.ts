export function positionKey(fen: string) {
  return fen.split(" ").slice(0, 4).join(" ");
}
