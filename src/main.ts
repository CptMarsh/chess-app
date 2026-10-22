import { attachBook } from "./book/book.ts";
import { BookBus } from "./book/messages.ts";
import { localLineStore } from "./storage/localLineStore.ts";
import { mountBookInput } from "./ui/bookInput.ts";

const bus = new BookBus();
attachBook(bus, localLineStore());
mountBookInput(document.querySelector<HTMLElement>("#app")!, bus);
