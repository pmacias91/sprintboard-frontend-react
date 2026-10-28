import { httpClient } from '../api/client';
import type { Member } from '../types/task';

export const memberService = {
  list(signal?: AbortSignal): Promise<Member[]> {
    return httpClient.get<Member[]>('/members', signal);
  },
};
