import { z } from 'zod';
import tasksUrl from '../../sample_data/tasks.json?url';
import usersUrl from '../../sample_data/users.json?url';
import { CURRENT_USER_ID, memberSchema, savedTaskSchema } from '../types/task';
import type { SampleData } from '../types/demo';

async function readJson(path: string): Promise<unknown> {
  const response = await fetch(new URL(path, window.location.origin), {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error('The sample JSON files could not be loaded.');
  }

  return response.json();
}

export async function loadSampleData(): Promise<SampleData> {
  const [rawTasks, rawUsers] = await Promise.all([
    readJson(tasksUrl),
    readJson(usersUrl),
  ]);
  const tasks = z.array(savedTaskSchema).parse(rawTasks);
  const users = z.array(memberSchema).min(1).parse(rawUsers);
  const userIds = new Set(users.map((user) => user.id));
  const taskIds = new Set(tasks.map((task) => task.id));

  if (
    userIds.size !== users.length ||
    taskIds.size !== tasks.length ||
    !userIds.has(CURRENT_USER_ID) ||
    tasks.some((task) => task.assigneeId && !userIds.has(task.assigneeId))
  ) {
    throw new Error('The sample data contains duplicate or unknown identifiers.');
  }

  return { tasks, users };
}
