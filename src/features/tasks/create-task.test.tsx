import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@radix-ui/react-tooltip';
import { MemoryRouter } from 'react-router-dom';
import { expect, it } from 'vitest';
import App from '../../app';
import { simulatedNetwork } from '../../mocks/network';
import { sessionStore } from '../../lib/session';
import { DEMO_USER } from '../../config/demo-account';

function renderApp(path = '/board') {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]} useTransitions={false}>
        <TooltipProvider>
          <App />
        </TooltipProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

it('validates a new task, saves it through the API, and shows it on Board and My Tasks', async () => {
  renderApp();
  const user = userEvent.setup();
  await user.click(await screen.findByRole('button', { name: 'Use demo credentials' }));
  await user.click(screen.getByRole('button', { name: 'Sign in' }));
  await screen.findByRole('button', { name: /Open SPR-101/ });
  await user.click(screen.getByRole('button', { name: 'New task' }));
  const dialog = screen.getByRole('dialog');
  await user.click(within(dialog).getByRole('button', { name: 'Create task' }));
  expect(await within(dialog).findByRole('alert')).toHaveTextContent(
    'at least 3 characters',
  );
  await user.type(
    within(dialog).getByLabelText(/Task title/),
    'Ship the accessible task editor',
  );
  await user.type(
    within(dialog).getByLabelText(/Description/),
    'Check keyboard navigation and saved task details.',
  );
  await user.click(within(dialog).getByRole('button', { name: 'Create task' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(
    await screen.findByRole('button', {
      name: 'Open SPR-1101: Ship the accessible task editor',
    }),
  ).toBeVisible();
  await user.click(
    within(screen.getByRole('navigation', { name: 'Main navigation' })).getByRole(
      'link',
      {
        name: /My Tasks/,
      },
    ),
  );
  expect(
    await screen.findByRole('button', {
      name: 'Open SPR-1101: Ship the accessible task editor',
    }),
  ).toBeVisible();
  await user.click(
    screen.getByRole('button', {
      name: 'Open SPR-1101: Ship the accessible task editor',
    }),
  );
  expect(screen.getByLabelText(/Task title/)).toHaveValue(
    'Ship the accessible task editor',
  );
  expect(screen.getByLabelText(/Description/)).toHaveValue(
    'Check keyboard navigation and saved task details.',
  );
  expect(screen.getByRole('combobox', { name: 'Assignee' })).toHaveTextContent(
    'Alex Morgan (you)',
  );
});

it('confirms deletion, preserves the editor on cancellation, and allows retry after failure', async () => {
  sessionStore.save(DEMO_USER, false);
  renderApp('/my-tasks?task=SPR-106');
  const user = userEvent.setup();
  await screen.findByRole('dialog', { name: 'Task details' });
  await user.click(screen.getByRole('button', { name: 'Delete task' }));
  let confirmation = screen.getByRole('dialog', { name: 'Delete task?' });
  await user.click(within(confirmation).getByRole('button', { name: 'Cancel' }));
  expect(screen.getByLabelText(/Task title/)).toHaveValue('Build the project dashboard');
  simulatedNetwork.configure({ failNextWrite: true });
  await user.click(screen.getByRole('button', { name: 'Delete task' }));
  confirmation = screen.getByRole('dialog', { name: 'Delete task?' });
  await user.click(within(confirmation).getByRole('button', { name: 'Delete task' }));
  expect(await within(confirmation).findByRole('alert')).toHaveTextContent(
    'simulated connection',
  );
  await user.click(within(confirmation).getByRole('button', { name: 'Delete task' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(screen.queryByRole('button', { name: /Open SPR-106:/ })).not.toBeInTheDocument();
  await user.click(
    within(screen.getByRole('navigation', { name: 'Main navigation' })).getByRole(
      'link',
      { name: /^Board/ },
    ),
  );
  expect(screen.queryByRole('button', { name: /Open SPR-106:/ })).not.toBeInTheDocument();
});
