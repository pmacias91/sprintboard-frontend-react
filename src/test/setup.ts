import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import sampleTasks from '../../sample_data/tasks.json';
import sampleUsers from '../../sample_data/users.json';
import { handlers } from '../mocks/handlers';
import { repository } from '../mocks/repository';
import { simulatedNetwork } from '../mocks/network';
import { sessionStore } from '../lib/session';

const server = setupServer(
  http.get('*/sample_data/tasks.json', () => HttpResponse.json(sampleTasks)),
  http.get('*/sample_data/users.json', () => HttpResponse.json(sampleUsers)),
  ...handlers,
);
configure({ asyncUtilTimeout: 5_000 });
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
beforeEach(() => {
  sessionStore.clear();
  localStorage.clear();
  sessionStorage.clear();
  repository.clear();
  simulatedNetwork.reset();
});
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());

// Browser APIs used by accessible Radix controls but absent in jsdom.
HTMLElement.prototype.scrollIntoView = () => {};
HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};
