import { startBookApp } from "./book/bookApp.ts";
import { microtaskScheduler } from "./book/write/schedulers.ts";
import { localEventStore } from "./storage/localEventStore.ts";
import { mountBookInput } from "./ui/bookInput.ts";

mountBookInput(document.querySelector<HTMLElement>("#app")!, startBookApp(localEventStore(), microtaskScheduler()));
