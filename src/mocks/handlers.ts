import { delay, http, HttpResponse } from 'msw';
import { taskSchema } from '../types/task';
import { repository } from './repository';
import { simulatedNetwork } from './network';
import { DEMO_CREDENTIALS, DEMO_USER } from '../config/demo-account';
import { loginCredentialsSchema } from '../types/auth';
import { demoSettingsSchema } from '../types/demo';

const origin =
  typeof location === 'undefined' ? 'http://localhost:5173' : location.origin;
const api = `${origin}/api`;
const errorResponse = (message = 'Your changes could not be saved. Try again.') =>
  HttpResponse.json({ message }, { status: 500 });
const sampleError = () =>
  HttpResponse.json(
    {
      message: 'The sample data could not be loaded. Check the JSON files and try again.',
    },
    { status: 503 },
  );
const failedWrite = () =>
  HttpResponse.json(
    { message: 'This save failed on the simulated connection. Try again.' },
    { status: 503 },
  );

async function demoInfo() {
  return { ...(await repository.info()), ...simulatedNetwork.settings() };
}

export const handlers = [
  http.post(`${api}/login`, async ({ request }) => {
    await delay(450);
    const result = loginCredentialsSchema.safeParse(await request.json());

    if (!result.success) {
      return HttpResponse.json(
        { message: 'Please check your email and password.' },
        { status: 400 },
      );
    }

    if (
      result.data.email !== DEMO_CREDENTIALS.email ||
      result.data.password !== DEMO_CREDENTIALS.password
    ) {
      return HttpResponse.json(
        {
          message:
            'Those details don’t match our demo account. Try the credentials below.',
        },
        { status: 401 },
      );
    }

    return HttpResponse.json(DEMO_USER);
  }),
  http.get(`${api}/members`, async ({ request }) => {
    await simulatedNetwork.wait('read');
    if (request.signal.aborted) {
      return HttpResponse.error();
    }
    try {
      return HttpResponse.json(await repository.members());
    } catch {
      return sampleError();
    }
  }),
  http.get(`${api}/tasks`, async ({ request }) => {
    await simulatedNetwork.wait('read');
    if (request.signal.aborted) {
      return HttpResponse.error();
    }
    try {
      return HttpResponse.json(await repository.list());
    } catch {
      return sampleError();
    }
  }),
  http.get(`${api}/demo`, async () => {
    await delay(80);
    try {
      return HttpResponse.json(await demoInfo());
    } catch {
      return sampleError();
    }
  }),
  http.post(`${api}/demo/settings`, async ({ request }) => {
    const result = demoSettingsSchema
      .partial()
      .strict()
      .safeParse(await request.json());
    if (!result.success) {
      return HttpResponse.json(
        { message: 'Choose a valid connection option.' },
        { status: 400 },
      );
    }
    simulatedNetwork.configure(result.data);
    try {
      return HttpResponse.json(await demoInfo());
    } catch {
      return sampleError();
    }
  }),
  http.post(`${api}/tasks`, async ({ request }) => {
    await simulatedNetwork.wait('write');
    if (request.signal.aborted) {
      return HttpResponse.error();
    }
    if (simulatedNetwork.consumeWriteFailure()) {
      return failedWrite();
    }
    const result = taskSchema.safeParse(await request.json());
    if (!result.success) {
      return HttpResponse.json(
        { message: 'Please check the task fields.' },
        { status: 400 },
      );
    }
    try {
      const members = await repository.members();
      if (
        result.data.assigneeId &&
        !members.some((member) => member.id === result.data.assigneeId)
      ) {
        return HttpResponse.json({ message: 'Choose a team member.' }, { status: 400 });
      }
      return HttpResponse.json(await repository.create(result.data), { status: 201 });
    } catch {
      return errorResponse();
    }
  }),
  http.patch(`${api}/tasks/:id`, async ({ request, params }) => {
    await simulatedNetwork.wait('write');
    if (request.signal.aborted) {
      return HttpResponse.error();
    }
    if (simulatedNetwork.consumeWriteFailure()) {
      return failedWrite();
    }
    const result = taskSchema.partial().safeParse(await request.json());
    if (!result.success) {
      return HttpResponse.json(
        { message: 'Please check the task fields.' },
        { status: 400 },
      );
    }
    try {
      const members = await repository.members();
      if (
        result.data.assigneeId &&
        !members.some((member) => member.id === result.data.assigneeId)
      ) {
        return HttpResponse.json({ message: 'Choose a team member.' }, { status: 400 });
      }
      const updated = await repository.update(String(params.id), result.data);
      return updated
        ? HttpResponse.json(updated)
        : HttpResponse.json({ message: 'This task no longer exists.' }, { status: 404 });
    } catch {
      return errorResponse();
    }
  }),
  http.post(`${api}/reset`, async () => {
    await simulatedNetwork.wait('write');
    try {
      const samples = await repository.reset();
      simulatedNetwork.configure({ failNextWrite: false });
      return HttpResponse.json(samples);
    } catch {
      return sampleError();
    }
  }),
];
