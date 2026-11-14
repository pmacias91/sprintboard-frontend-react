import { expect, it, vi } from 'vitest';
import { DEMO_USER } from '../config/demo-account';
import { sessionStore } from '../lib/session';
import { taskService } from '../services/task-service';
import { repository } from './repository';
import { TASK_STORAGE_KEY } from './task-storage';
import { simulatedNetwork } from './network';

it('preserves creates, edits, moves, and deletions across reloads within one session', async () => {
  sessionStore.save(DEMO_USER, false);
  const [original] = await repository.list();
  const created = await repository.create({
    title: 'A session task',
    description: '',
    status: 'todo',
    priority: 'medium',
    assigneeId: DEMO_USER.id,
    dueDate: '',
  });
  await repository.update(created.id, { title: 'An edited task', status: 'done' });
  await repository.delete(original.id);
  repository.clear(); // A reload discards the module's memory, keeping browser storage.
  const restored = await repository.list();
  expect(restored.find((task) => task.id === created.id)).toMatchObject({
    title: 'An edited task',
    status: 'done',
  });
  expect(restored.some((task) => task.id === original.id)).toBe(false);
  expect((await repository.info()).changes).toBe(3);
  await repository.reset();
  repository.clear();
  expect(await repository.list()).toHaveLength(1000);
  expect((await repository.list()).find((task) => task.id === original.id)).toEqual(
    original,
  );
  expect((await repository.info()).changes).toBe(0);
});

it('clears changes on sign-out, including a fresh sign-in with the same user', async () => {
  sessionStore.save(DEMO_USER, true);
  const sessionId = sessionStore.getSessionId();
  await repository.delete('SPR-101');
  sessionStore.clear();
  expect(localStorage.getItem(TASK_STORAGE_KEY)).toBeNull();
  await expect(repository.list()).rejects.toThrow('session has ended');
  sessionStore.save(DEMO_USER, true);
  expect(sessionStore.getSessionId()).not.toBe(sessionId);
  expect((await repository.list()).some((task) => task.id === 'SPR-101')).toBe(true);
});

it('ignores a previous browser session snapshot when its cookie has disappeared', async () => {
  sessionStore.save(DEMO_USER, false);
  await repository.delete('SPR-101');
  const oldSnapshot = localStorage.getItem(TASK_STORAGE_KEY)!;
  document.cookie = 'sprintboard.session.v3=; Path=/; Max-Age=0';
  repository.clear();
  sessionStore.save(DEMO_USER, false);
  // Even an orphaned snapshot cannot be restored into a new session.
  localStorage.setItem(TASK_STORAGE_KEY, oldSnapshot);
  expect((await repository.list()).some((task) => task.id === 'SPR-101')).toBe(true);
});

it('discards changes when a remembered session expires', async () => {
  sessionStore.save(DEMO_USER, true);
  await repository.delete('SPR-101');
  const now = Date.now();
  const clock = vi.spyOn(Date, 'now').mockReturnValue(now + 31 * 86400_000);
  try {
    window.dispatchEvent(new Event('focus'));
    expect(sessionStore.getSessionId()).toBeNull();
    expect(localStorage.getItem(TASK_STORAGE_KEY)).toBeNull();
    await expect(repository.list()).rejects.toThrow('session has ended');
  } finally {
    clock.mockRestore();
  }
  sessionStore.save(DEMO_USER, false);
  expect((await repository.list()).some((task) => task.id === 'SPR-101')).toBe(true);
});

it('rejects a delayed deletion from an ended session without touching the next session', async () => {
  sessionStore.save(DEMO_USER, false);
  await repository.list();
  const pending = taskService.delete('SPR-101');
  const rejected = expect(pending).rejects.toThrow('session has ended');
  sessionStore.clear();
  sessionStore.save(DEMO_USER, false);
  await rejected;
  expect((await repository.list()).some((task) => task.id === 'SPR-101')).toBe(true);
});

it('keeps a task when deletion fails and deletes it on retry', async () => {
  sessionStore.save(DEMO_USER, false);
  simulatedNetwork.configure({ failNextWrite: true });
  await expect(taskService.delete('SPR-101')).rejects.toThrow('simulated connection');
  expect((await repository.list()).some((task) => task.id === 'SPR-101')).toBe(true);
  await taskService.delete('SPR-101');
  repository.clear();
  expect((await repository.list()).some((task) => task.id === 'SPR-101')).toBe(false);
  await expect(taskService.delete('SPR-101')).rejects.toThrow('no longer exists');
});

it('does not reuse deleted task IDs, including after a reload', async () => {
  sessionStore.save(DEMO_USER, false);
  const input = {
    title: 'A task with a unique link',
    description: '',
    status: 'todo' as const,
    priority: 'medium' as const,
    assigneeId: DEMO_USER.id,
    dueDate: '',
  };
  await repository.delete('SPR-1100');
  repository.clear();
  const first = await repository.create(input);
  expect(first.id).toBe('SPR-1101');
  await repository.delete(first.id);
  repository.clear();
  const second = await repository.create(input);
  expect(second.id).toBe('SPR-1102');
});

it.each(['create', 'update'] as const)(
  'rejects a %s if the session changes while validating its assignee',
  async (operation) => {
    sessionStore.save(DEMO_USER, false);
    const members = repository.members;
    const validation = vi
      .spyOn(repository, 'members')
      .mockImplementationOnce(async () => {
        const users = await members();
        sessionStore.clear();
        sessionStore.save(DEMO_USER, false);
        return users;
      });
    try {
      const input = {
        title: 'An old session must not save this',
        description: '',
        status: 'todo' as const,
        priority: 'medium' as const,
        assigneeId: DEMO_USER.id,
        dueDate: '',
      };
      const pending =
        operation === 'create'
          ? taskService.create(input)
          : taskService.update('SPR-101', input);
      await expect(pending).rejects.toThrow('session has ended');
      const tasks = await repository.list();
      expect(tasks).toHaveLength(1000);
      expect(tasks.some((task) => task.title === input.title)).toBe(false);
    } finally {
      validation.mockRestore();
    }
  },
);

it('restores the samples when the saved snapshot is invalid', async () => {
  sessionStore.save(DEMO_USER, false);
  await repository.delete('SPR-101');
  localStorage.setItem(TASK_STORAGE_KEY, '{invalid json');
  repository.clear();
  expect((await repository.list()).some((task) => task.id === 'SPR-101')).toBe(true);
  expect((await repository.info()).changes).toBe(0);
});

it('falls back to memory without restoring a stale snapshot after a quota failure', async () => {
  sessionStore.save(DEMO_USER, false);
  await repository.list();
  const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
    throw new DOMException('Storage is full', 'QuotaExceededError');
  });
  try {
    await repository.delete('SPR-101');
    expect((await repository.info()).persistence).toBe('memory');
    expect(localStorage.getItem(TASK_STORAGE_KEY)).toBeNull();
    expect((await repository.list()).some((task) => task.id === 'SPR-101')).toBe(false);
  } finally {
    write.mockRestore();
  }
  repository.clear();
  expect((await repository.list()).some((task) => task.id === 'SPR-101')).toBe(true);
});
