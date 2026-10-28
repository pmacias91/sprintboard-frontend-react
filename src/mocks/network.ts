import { delay } from 'msw';
import type { DemoSettings } from '../types/demo';

let settings: DemoSettings = { latency: 'normal', failNextWrite: false };
let requestNumber = 0;

export const simulatedNetwork = {
  settings(): DemoSettings {
    return { ...settings };
  },
  configure(changes: Partial<DemoSettings>): void {
    settings = { ...settings, ...changes };
  },
  async wait(operation: 'read' | 'write'): Promise<void> {
    const base = settings.latency === 'slow' ? 1_200 : 260;
    const variation = (++requestNumber % 4) * 70;
    await delay(base + variation + (operation === 'write' ? 140 : 0));
  },
  consumeWriteFailure(): boolean {
    const shouldFail = settings.failNextWrite;
    settings.failNextWrite = false;
    return shouldFail;
  },
  reset(): void {
    settings = { latency: 'normal', failNextWrite: false };
    requestNumber = 0;
  },
};
