export function drain<T>(queue: T[], run: (item: T) => void) {
  for (let item = queue.shift(); item; item = queue.shift()) run(item);
}
