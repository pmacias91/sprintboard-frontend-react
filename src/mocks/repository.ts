import type { Task, TaskInput } from '../types/task';
import type { SampleData } from '../types/demo';
import { loadSampleData } from './sample-loader';
import { discardOtherSessions, persistTasks, restoreTasks } from './task-storage';
import { sessionStore } from '../lib/session';

type SessionData = SampleData & { sessionId: string; nextTaskNumber: number };
let database: SessionData | undefined;
let initialLoad: Promise<SessionData> | undefined;
let activeSessionId = sessionStore.getSessionId();
let changes = 0;
let persistence: 'local' | 'memory' = 'local';

function nextTaskNumber(tasks: Task[]): number {
  return Math.max(100, ...tasks.map((task) => Number(task.id.replace('SPR-', '')))) + 1;
}

function requireSession(sessionId: string | null): asserts sessionId is string {
  if (!sessionId || sessionStore.getSessionId() !== sessionId) {
    throw new Error('Your session has ended. Sign in again to continue.');
  }
}

async function ready(): Promise<SessionData> {
  const sessionId = sessionStore.getSessionId();
  requireSession(sessionId);
  if (sessionId !== activeSessionId) {
    repository.clear();
    activeSessionId = sessionId;
    discardOtherSessions(sessionId);
  }
  if (database) {
    // Other tabs use the same session snapshot; refresh must read their latest edits.
    const saved =
      persistence === 'local' ? restoreTasks(database.users, sessionId) : null;
    if (saved) {
      database.tasks = saved.tasks;
      database.nextTaskNumber = Math.max(
        database.nextTaskNumber,
        saved.nextTaskNumber ?? nextTaskNumber(saved.tasks),
      );
      changes = saved.changes;
    }
    return database;
  }

  initialLoad ??= loadSampleData()
    .then((samples) => {
      requireSession(sessionId);
      const saved = restoreTasks(samples.users, sessionId);
      const tasks = saved?.tasks ?? samples.tasks;
      const next = Math.max(
        saved?.nextTaskNumber ?? 101,
        nextTaskNumber(samples.tasks),
        nextTaskNumber(tasks),
      );
      changes = saved?.changes ?? 0;
      persistence = persistTasks(tasks, changes, sessionId, next);
      database = { ...samples, tasks, sessionId, nextTaskNumber: next };
      return database;
    })
    .finally(() => {
      if (activeSessionId === sessionId) {
        initialLoad = undefined;
      }
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
    return {
      taskCount: data.tasks.length,
      userCount: data.users.length,
      changes,
      persistence,
    };
  },
  async create(input: TaskInput): Promise<Task> {
    const data = await ready();
    requireSession(data.sessionId);
    const next = data.nextTaskNumber;
    const task: Task = {
      ...input,
      id: `SPR-${next}`,
      labels: [],
      createdAt: new Date().toISOString(),
    };
    const tasks = [task, ...data.tasks];
    persistence = persistTasks(tasks, changes + 1, data.sessionId, next + 1);
    data.tasks = tasks;
    data.nextTaskNumber = next + 1;
    changes += 1;
    return structuredClone(task);
  },
  async update(id: string, input: Partial<TaskInput>): Promise<Task | undefined> {
    const data = await ready();
    requireSession(data.sessionId);
    const current = data.tasks.find((task) => task.id === id);
    if (!current) {
      return undefined;
    }
    const updated = { ...current, ...input };
    const tasks = data.tasks.map((task) => (task.id === id ? updated : task));
    persistence = persistTasks(tasks, changes + 1, data.sessionId, data.nextTaskNumber);
    data.tasks = tasks;
    changes += 1;
    return structuredClone(updated);
  },
  async delete(id: string): Promise<boolean> {
    const data = await ready();
    requireSession(data.sessionId);
    if (!data.tasks.some((task) => task.id === id)) {
      return false;
    }
    const tasks = data.tasks.filter((task) => task.id !== id);
    persistence = persistTasks(tasks, changes + 1, data.sessionId, data.nextTaskNumber);
    data.tasks = tasks;
    changes += 1;
    return true;
  },
  async reset(): Promise<SampleData> {
    const sessionId = sessionStore.getSessionId();
    requireSession(sessionId);
    // Replace both collections only after the entire new sample has been validated.
    const samples = await loadSampleData();
    requireSession(sessionId);
    const next = nextTaskNumber(samples.tasks);
    persistence = persistTasks(samples.tasks, 0, sessionId, next);
    database = { ...samples, sessionId, nextTaskNumber: next };
    changes = 0;
    return structuredClone(samples);
  },
  clear(): void {
    database = undefined;
    initialLoad = undefined;
    changes = 0;
    persistence = 'local';
  },
};

discardOtherSessions(activeSessionId);
sessionStore.subscribe(() => {
  const nextSessionId = sessionStore.getSessionId();
  if (nextSessionId !== activeSessionId) {
    repository.clear();
    activeSessionId = nextSessionId;
    discardOtherSessions(nextSessionId);
  }
});
