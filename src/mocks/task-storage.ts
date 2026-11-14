import { z } from 'zod';
import { savedTaskSchema, type Member, type Task } from '../types/task';

export const TASK_STORAGE_KEY = 'sprintboard.tasks.v2';
const snapshotSchema = z.object({
  version: z.literal(2),
  sessionId: z.string().min(1),
  tasks: z.array(savedTaskSchema),
  changes: z.number().int().nonnegative(),
  nextTaskNumber: z.number().int().min(101).optional(),
});

export function discardOtherSessions(sessionId: string | null): void {
  try {
    localStorage.removeItem('sprintboard.tasks.v1');
    const value = localStorage.getItem(TASK_STORAGE_KEY);
    if (value && (!sessionId || JSON.parse(value).sessionId !== sessionId)) {
      localStorage.removeItem(TASK_STORAGE_KEY);
    }
  } catch {
    // Storage may be unavailable; session validation also applies when restoring.
  }
}

export function restoreTasks(users: Member[], sessionId: string) {
  try {
    const value = localStorage.getItem(TASK_STORAGE_KEY);
    const snapshot = snapshotSchema.parse(value ? JSON.parse(value) : null);
    const userIds = new Set(users.map((user) => user.id));
    if (
      snapshot.sessionId !== sessionId ||
      new Set(snapshot.tasks.map((task) => task.id)).size !== snapshot.tasks.length ||
      snapshot.tasks.some((task) => task.assigneeId && !userIds.has(task.assigneeId))
    ) {
      return null;
    }
    return snapshot;
  } catch {
    return null;
  }
}

export function persistTasks(
  tasks: Task[],
  changes: number,
  sessionId: string,
  nextTaskNumber: number,
): 'local' | 'memory' {
  try {
    localStorage.setItem(
      TASK_STORAGE_KEY,
      JSON.stringify({ version: 2, sessionId, tasks, changes, nextTaskNumber }),
    );
    return 'local';
  } catch {
    // A quota failure must not leave an older snapshot that could resurrect edits.
    try {
      localStorage.removeItem(TASK_STORAGE_KEY);
    } catch {
      let previous: string | null = null;
      try {
        previous = localStorage.getItem(TASK_STORAGE_KEY);
      } catch {
        // Fully blocked storage is unavailable for both reads and writes.
      }
      if (previous !== null) {
        throw new Error('Previous task data could not be cleared. Try again.');
      }
    }
    return 'memory';
  }
}
