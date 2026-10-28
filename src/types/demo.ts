import { z } from 'zod';
import type { Member, Task } from './task';

export const demoSettingsSchema = z.object({
  latency: z.enum(['normal', 'slow']),
  failNextWrite: z.boolean(),
});

export type DemoSettings = z.infer<typeof demoSettingsSchema>;

export interface DemoInfo extends DemoSettings {
  taskCount: number;
  userCount: number;
  changes: number;
}

export interface SampleData {
  tasks: Task[];
  users: Member[];
}
