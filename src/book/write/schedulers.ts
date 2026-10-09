export type Scheduler = { schedule(task: () => void): void };

export type ManualScheduler = Scheduler & { run(): void };

export function manualScheduler(): ManualScheduler {
  return { schedule() {}, run() {} };
}
