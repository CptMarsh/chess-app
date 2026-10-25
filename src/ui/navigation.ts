import type { MoveNode } from "../line/messages.ts";

export function viewOf(id: number, current: number): number | null {
  return id === current ? null : id;
}

export function nextView(key: string, viewed: number | null, nodes: MoveNode[], current: number): number | null {
  const at = nodes.find((node) => node.id === (viewed ?? current))!;
  switch (key) {
    case "ArrowLeft":
      return viewOf(at.parent ?? at.id, current);
    case "ArrowRight": {
      const child = nodes.find((node) => node.parent === at.id);
      return child ? viewOf(child.id, current) : viewed;
    }
    case "ArrowUp":
      return viewOf(nodes.find((node) => node.parent === null)!.id, current);
    case "ArrowDown":
      return null;
    default:
      return viewed;
  }
}

export function keptView(viewed: number | null, shownCurrent: number, current: number): number | null {
  return shownCurrent === current ? viewed : null;
}

export function childOf(nodes: MoveNode[], at: number, uci: string): number | undefined {
  return nodes.find((node) => node.parent === at && node.uci === uci)?.id;
}
