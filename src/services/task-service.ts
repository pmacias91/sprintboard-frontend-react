import { httpClient } from '../api/client';
import type { Task, TaskInput } from '../types/task';

export const taskService = {
  list(signal?: AbortSignal): Promise<Task[]> {
    return httpClient.get<Task[]>('/tasks', signal);
  },

  create(input: TaskInput): Promise<Task> {
    return httpClient.post<Task>('/tasks', input);
  },

  update(id: string, changes: Partial<TaskInput>): Promise<Task> {
    return httpClient.patch<Task>(`/tasks/${encodeURIComponent(id)}`, changes);
  },
};
