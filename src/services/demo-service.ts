import { httpClient } from '../api/client';
import type { DemoInfo, DemoSettings, SampleData } from '../types/demo';

export const demoService = {
  info(signal?: AbortSignal): Promise<DemoInfo> {
    return httpClient.get<DemoInfo>('/demo', signal);
  },
  configure(settings: Partial<DemoSettings>): Promise<DemoInfo> {
    return httpClient.post<DemoInfo>('/demo/settings', settings);
  },
  reset(): Promise<SampleData> {
    return httpClient.post<SampleData>('/reset');
  },
};
