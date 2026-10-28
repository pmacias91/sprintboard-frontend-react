import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import sampleTasks from '../../../sample_data/tasks.json';
import sampleUsers from '../../../sample_data/users.json';
import { memberSchema, savedTaskSchema } from '../../types/task';
import { TaskCard } from './task-card';

describe('TaskCard', () => {
  it('shows the task’s key details and opens it with the keyboard', async () => {
    const onOpen = vi.fn();
    const task = savedTaskSchema.parse(sampleTasks[0]);
    const members = sampleUsers.map((member) => memberSchema.parse(member));
    render(<TaskCard task={task} members={members} onOpen={onOpen} />);
    expect(screen.getByText(task.title)).toBeVisible();
    expect(screen.getByText('SPR-101')).toBeVisible();
    expect(screen.getByText('High')).toBeVisible();
    expect(screen.getByText('Design')).toBeVisible();
    expect(screen.getByLabelText('Sarah Chen')).toBeVisible();
    const user = userEvent.setup();
    await user.tab();
    expect(screen.getByRole('button', { name: /Open SPR-101/ })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onOpen).toHaveBeenCalledWith(task);
  });
});
