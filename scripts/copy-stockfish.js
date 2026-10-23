import fs from "node:fs";

const FILES = ["stockfish-19-lite-single.js", "stockfish-19-lite-single.wasm"];

fs.mkdirSync("public/stockfish", { recursive: true });
for (const file of FILES) {
  fs.copyFileSync(`node_modules/stockfish/bin/${file}`, `public/stockfish/${file}`);
}
