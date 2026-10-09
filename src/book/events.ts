export type Side = "white" | "black";

export type LineAdded = { type: "LineAdded"; v: 1; side: Side; moves: string[] };

export type BookEvent = LineAdded;
