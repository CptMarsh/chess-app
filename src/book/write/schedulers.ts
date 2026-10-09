import { drain } from "./drain.ts";

export type Scheduler = { schedule(task: () => void): void };

export type ManualScheduler = Scheduler & { run(): void };

export function microtaskScheduler(): Scheduler {
  return {
    schedule(task) {
      queueMicrotask(task);
    },
  };
}

export function manualScheduler(): ManualScheduler {
  const tasks: (() => void)[] = [];
  return {
    schedule(task) {
      tasks.push(task);
    },
    run() {
      drain(tasks, (task) => task());
    },
  };
}
