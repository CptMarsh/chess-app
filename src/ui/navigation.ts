export function viewOf(moves: number, moveCount: number): number | null {
  return moves >= moveCount ? null : moves;
}

export function nextView(key: string, viewed: number | null, moveCount: number): number | null {
  switch (key) {
    case "ArrowLeft":
      return viewOf(Math.max(0, (viewed ?? moveCount) - 1), moveCount);
    case "ArrowRight":
      return viewed === null ? null : viewOf(viewed + 1, moveCount);
    case "ArrowUp":
      return viewOf(0, moveCount);
    case "ArrowDown":
      return null;
    default:
      return viewed;
  }
}

export function keptView(viewed: number | null, shownCount: number, moveCount: number): number | null {
  return shownCount === moveCount ? viewed : null;
}
