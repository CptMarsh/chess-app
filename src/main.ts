import { attachBook } from "./book/book.ts";
import { createBookBus } from "./book/messages.ts";
import { localLineStore } from "./storage/localLineStore.ts";
import { mountBookInput } from "./ui/bookInput.ts";

const bus = createBookBus();
attachBook(bus, localLineStore());
mountBookInput(document.querySelector<HTMLElement>("#app")!, bus);
