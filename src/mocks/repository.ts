import type { Task, TaskInput } from '../types/task';
import type { SampleData } from '../types/demo';
import { loadSampleData } from './sample-loader';

let database: SampleData | undefined;
let initialLoad: Promise<SampleData> | undefined;
let changes = 0;

async function ready(): Promise<SampleData> {
  if (database) {
    return database;
  }

  initialLoad ??= loadSampleData()
    .then((samples) => {
      database ??= samples;
      return database;
    })
    .finally(() => {
      initialLoad = undefined;
    });

  return initialLoad;
}

export const repository = {
  async list(): Promise<Task[]> {
    return structuredClone((await ready()).tasks);
  },
  async members() {
    return structuredClone((await ready()).users);
  },
  async info() {
    const data = await ready();
    return { taskCount: data.tasks.length, userCount: data.users.length, changes };
  },
  async create(input: TaskInput): Promise<Task> {
    const data = await ready();
    const next =
      Math.max(100, ...data.tasks.map((task) => Number(task.id.replace('SPR-', '')))) + 1;
    const task: Task = {
      ...input,
      id: `SPR-${next}`,
      labels: [],
      createdAt: new Date().toISOString(),
    };
    data.tasks.unshift(task);
    changes += 1;
    return structuredClone(task);
  },
  async update(id: string, input: Partial<TaskInput>): Promise<Task | undefined> {
    const data = await ready();
    const current = data.tasks.find((task) => task.id === id);
    if (!current) {
      return undefined;
    }
    const updated = { ...current, ...input };
    data.tasks = data.tasks.map((task) => (task.id === id ? updated : task));
    changes += 1;
    return structuredClone(updated);
  },
  async reset(): Promise<SampleData> {
    // Replace both collections only after the entire new sample has been validated.
    const samples = await loadSampleData();
    database = samples;
    changes = 0;
    return structuredClone(samples);
  },
  clear(): void {
    database = undefined;
    initialLoad = undefined;
    changes = 0;
  },
};
