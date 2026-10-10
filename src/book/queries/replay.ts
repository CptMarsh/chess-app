import { Chess } from "chess.js";

function positionKey(fen: string) {
  return fen.split(" ").slice(0, 4).join(" ");
}

export function replay(moves: string[]) {
  const chess = new Chess();
  const before = moves.map((move) => {
    const key = positionKey(chess.fen());
    chess.move(move);
    return key;
  });
  return { before, end: positionKey(chess.fen()) };
}
