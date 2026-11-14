import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { expect, it, vi } from 'vitest';
import sampleTasks from '../../sample_data/tasks.json';
import { DEMO_USER } from '../config/demo-account';
import { sessionStore } from '../lib/session';
import { taskService } from '../services/task-service';
import { savedTaskSchema, type Task } from '../types/task';
import { useMoveTask } from './use-tasks';

it('does not roll back an old session move into the new session cache', async () => {
  sessionStore.save(DEMO_USER, false);
  const original = savedTaskSchema.parse(sampleTasks[0]);
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  client.setQueryData(['tasks'], [{ ...original, status: 'in-progress' }]);
  let finishRequest!: () => void;
  const heldRequest = new Promise<void>((resolve) => {
    finishRequest = resolve;
  });
  const request = vi.spyOn(taskService, 'update').mockImplementationOnce(async () => {
    await heldRequest;
    throw new Error('Your session has ended.');
  });
  const { result } = renderHook(() => useMoveTask(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
  try {
    let outcome!: Promise<boolean>;
    act(() => {
      outcome = result.current.mutateAsync({ id: original.id, status: 'done' }).then(
        () => true,
        () => false,
      );
    });
    await waitFor(() => {
      expect(client.getQueryData<Task[]>(['tasks'])?.[0].status).toBe('done');
    });
    sessionStore.clear();
    sessionStore.save(DEMO_USER, false);
    client.clear();
    client.setQueryData(['tasks'], [original]);
    await act(async () => {
      finishRequest();
      expect(await outcome).toBe(false);
    });
    expect(client.getQueryData<Task[]>(['tasks'])?.[0].status).toBe(original.status);
  } finally {
    request.mockRestore();
    client.clear();
  }
});
