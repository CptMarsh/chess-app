import { StockfishEngine } from "./engine/engine.ts";
import { LichessExplorer } from "./explorer/explorer.ts";
import { attachLine } from "./line/line.ts";
import { LineBus } from "./line/messages.ts";
import { Trainer } from "./trainer/trainer.ts";
import { mountTrainer } from "./ui/trainerView.ts";

const bus = new LineBus();
attachLine(bus);
const engine = new StockfishEngine(new Worker("/stockfish/stockfish-19-lite-single.js"));
const explorer = new LichessExplorer(import.meta.env.VITE_LICHESS_TOKEN ?? "");
const view = { show: () => {} };
const trainer = new Trainer(bus, engine, explorer, () => view.show());
view.show = mountTrainer(document.querySelector<HTMLElement>("#app")!, bus, trainer);
view.show();
