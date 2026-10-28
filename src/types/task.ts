import { z } from 'zod';

export const statuses = ['todo', 'in-progress', 'done'] as const;
export const priorities = ['urgent', 'high', 'medium', 'low'] as const;
export type Status = (typeof statuses)[number];
export type Priority = (typeof priorities)[number];

export const statusLabels: Record<Status, string> = {
  todo: 'To Do',
  'in-progress': 'In Progress',
  done: 'Done',
};
export const priorityLabels: Record<Priority, string> = {
  urgent: 'Urgent',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export const memberSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  initials: z.string().min(1),
  color: z.enum(['lavender', 'peach', 'sage', 'rose']),
  role: z.string().min(1),
});
export type Member = z.infer<typeof memberSchema>;

export const taskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Give your task a title of at least 3 characters.')
    .max(120, 'Keep the title under 120 characters.'),
  description: z
    .string()
    .trim()
    .max(4000, 'Keep the description under 4,000 characters.'),
  status: z.enum(statuses),
  priority: z.enum(priorities),
  assigneeId: z.string(),
  dueDate: z.string().refine((value) => {
    if (!value) {
      return true;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return false;
    }
    const parsed = new Date(`${value}T12:00:00Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  }, 'Enter a valid date.'),
});

export type TaskInput = z.infer<typeof taskSchema>;
export const savedTaskSchema = taskSchema.extend({
  id: z.string().regex(/^SPR-\d+$/),
  labels: z.array(z.string()),
  createdAt: z.string().datetime(),
});
export type Task = z.infer<typeof savedTaskSchema>;

export const CURRENT_USER_ID = 'alex';
