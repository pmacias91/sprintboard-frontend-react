import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { demoService } from '../services/demo-service';
import { memberService } from '../services/member-service';
import { taskService } from '../services/task-service';
import type { Task, TaskInput } from '../types/task';
import type { DemoSettings } from '../types/demo';

const TASKS_QUERY_KEY = ['tasks'] as const;
const MEMBERS_QUERY_KEY = ['members'] as const;
const DEMO_QUERY_KEY = ['demo'] as const;
export const TASK_WRITE_KEY = ['task-write'] as const;
export const SAMPLE_RELOAD_KEY = ['sample-reload'] as const;

export function useTasks() {
  return useQuery({
    queryKey: TASKS_QUERY_KEY,
    queryFn: ({ signal }) => taskService.list(signal),
  });
}

export function useMembers() {
  return useQuery({
    queryKey: MEMBERS_QUERY_KEY,
    queryFn: ({ signal }) => memberService.list(signal),
    staleTime: Infinity,
  });
}

export function useDemoState() {
  return useQuery({
    queryKey: DEMO_QUERY_KEY,
    queryFn: ({ signal }) => demoService.info(signal),
  });
}

export function useDemoSettings() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (settings: Partial<DemoSettings>) => demoService.configure(settings),
    onSuccess: (info) => client.setQueryData(DEMO_QUERY_KEY, info),
  });
}

export function useSaveTask(id?: string) {
  const client = useQueryClient();

  return useMutation({
    mutationKey: TASK_WRITE_KEY,
    onMutate: () => client.cancelQueries({ queryKey: TASKS_QUERY_KEY }),
    mutationFn: (input: TaskInput) => {
      if (id) {
        return taskService.update(id, input);
      }

      return taskService.create(input);
    },
    onSuccess: (saved) => {
      client.setQueryData<Task[]>(TASKS_QUERY_KEY, (tasks = []) => {
        if (id) {
          return tasks.map((task) => (task.id === id ? saved : task));
        }

        return [saved, ...tasks];
      });
    },
    onSettled: () => {
      void client.invalidateQueries({ queryKey: DEMO_QUERY_KEY });
    },
  });
}

export function useMoveTask() {
  const client = useQueryClient();

  return useMutation({
    mutationKey: TASK_WRITE_KEY,
    mutationFn: ({ id, status }: Pick<Task, 'id' | 'status'>) => {
      return taskService.update(id, { status });
    },
    onMutate: async ({ id, status }) => {
      await client.cancelQueries({ queryKey: TASKS_QUERY_KEY });

      const tasks = client.getQueryData<Task[]>(TASKS_QUERY_KEY);
      const previousStatus = tasks?.find((task) => task.id === id)?.status;

      client.setQueryData<Task[]>(TASKS_QUERY_KEY, (current = []) => {
        return current.map((task) => (task.id === id ? { ...task, status } : task));
      });

      return { previousStatus };
    },
    onSuccess: (saved) => {
      client.setQueryData<Task[]>(TASKS_QUERY_KEY, (tasks = []) => {
        return tasks.map((task) => (task.id === saved.id ? saved : task));
      });
    },
    onError: (_error, { id }, context) => {
      const previousStatus = context?.previousStatus;

      if (!previousStatus) {
        return;
      }

      client.setQueryData<Task[]>(TASKS_QUERY_KEY, (tasks = []) => {
        return tasks.map((task) => {
          return task.id === id ? { ...task, status: previousStatus } : task;
        });
      });
    },
    onSettled: () => {
      void client.invalidateQueries({ queryKey: DEMO_QUERY_KEY });
    },
  });
}

export function useResetDemo() {
  const client = useQueryClient();

  return useMutation({
    mutationKey: SAMPLE_RELOAD_KEY,
    mutationFn: demoService.reset,
    onMutate: async () => {
      await Promise.all([
        client.cancelQueries({ queryKey: TASKS_QUERY_KEY }),
        client.cancelQueries({ queryKey: MEMBERS_QUERY_KEY }),
        client.cancelQueries({ queryKey: DEMO_QUERY_KEY }),
      ]);
    },
    onSuccess: (samples) => {
      client.setQueryData(TASKS_QUERY_KEY, samples.tasks);
      client.setQueryData(MEMBERS_QUERY_KEY, samples.users);
    },
    onSettled: () => {
      void client.invalidateQueries({ queryKey: DEMO_QUERY_KEY });
    },
  });
}
