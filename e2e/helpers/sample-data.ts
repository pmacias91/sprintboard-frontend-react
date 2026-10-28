import { expect, type Page } from '@playwright/test';

async function openSampleOptions(page: Page) {
  await page.getByRole('button', { name: 'Sample data options', exact: true }).click();
  const options = page.getByRole('dialog', { name: 'Sample data options', exact: true });
  await expect(options).toBeVisible();
  return options;
}

export async function verifySampleCollections(page: Page): Promise<void> {
  const board = page.getByRole('region', { name: 'Task board', exact: true });
  const todo = page.getByRole('region', { name: 'To Do column' });
  const sampleInfo = page.getByLabel('Sample data', { exact: true });
  await expect(sampleInfo).toContainText('1,000 tasks');
  await expect(sampleInfo).toContainText('10 users');
  await expect(todo.getByRole('button', { name: /^Open SPR-/ })).toHaveCount(30);
  await todo.getByRole('button', { name: 'Show more To Do tasks' }).click();
  await expect(todo.getByRole('button', { name: /^Open SPR-/ })).toHaveCount(60);
  await board.evaluate((element) => element.scrollTo({ top: 0, left: 0 }));
}

export async function verifyPersonalBatches(page: Page): Promise<void> {
  const list = page.getByRole('region', { name: 'My tasks list' });
  const table = list.getByRole('table', { name: 'Tasks assigned to me' });
  await expect(table.getByRole('row')).toHaveCount(26);
  await list.getByRole('button', { name: 'Show more assigned tasks' }).click();
  await expect(table.getByRole('row')).toHaveCount(51);
  await list.evaluate((element) => element.scrollTo({ top: 0, left: 0 }));
}

export async function verifyAsyncTaskRecovery(page: Page): Promise<void> {
  const title = 'Open SPR-1101: Finalize the launch checklist';
  const inProgress = page.getByRole('region', { name: 'In Progress column' });
  const done = page.getByRole('region', { name: 'Done column' });
  const moved = inProgress.getByRole('button', { name: title, exact: true });

  let options = await openSampleOptions(page);
  const connection = options.getByRole('combobox', { name: 'Simulated connection' });
  await connection.click();
  await page.getByRole('option', { name: 'Slow', exact: true }).click();
  await expect(connection).toHaveText('Slow');
  await page.screenshot({ path: '.local/preview/sample-controls-desktop.png' });
  await page.keyboard.press('Escape');

  // Refetching is asynchronous, but keeps the current data and in-memory edits visible.
  const refresh = page.getByRole('button', { name: 'Refresh tasks', exact: true });
  await refresh.click();
  await expect(refresh).toHaveAttribute('aria-busy', 'true');
  await expect(moved).toBeVisible();
  await expect(refresh).toHaveAttribute('aria-busy', 'false');
  await expect(moved).toBeVisible();

  options = await openSampleOptions(page);
  await options.getByRole('button', { name: 'Fail next save', exact: true }).click();
  await expect(options.getByRole('button', { name: 'Fail next save' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.keyboard.press('Escape');

  // The optimistic move is visible during the slow write, then rolls back on failure.
  await moved.dragTo(done.getByRole('heading'));
  await expect(done.getByRole('button', { name: title, exact: true })).toBeVisible();
  await expect(page.getByText('Couldn’t move task', { exact: true })).toBeVisible();
  await expect(moved).toBeVisible();
  await expect(done.getByRole('button', { name: title, exact: true })).not.toBeVisible();
  await expect(done).toHaveAttribute('aria-busy', 'false');

  options = await openSampleOptions(page);
  await expect(options.getByRole('button', { name: 'Fail next save' })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  await options.getByRole('combobox', { name: 'Simulated connection' }).click();
  await page.getByRole('option', { name: 'Normal', exact: true }).click();
  await expect(
    options.getByRole('combobox', { name: 'Simulated connection' }),
  ).toHaveText('Normal');
  await page.keyboard.press('Escape');
}

export async function verifySampleRestoration(page: Page): Promise<void> {
  const originalTitle = 'Open SPR-101: Design the new onboarding flow';
  await page.getByRole('button', { name: originalTitle, exact: true }).click();
  const editor = page.getByRole('dialog', { name: 'Task details' });
  await editor
    .getByLabel('Task title', { exact: false })
    .fill('Review onboarding accessibility');
  await editor.getByRole('button', { name: 'Save changes' }).click();
  await expect(editor).not.toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Open SPR-101: Review onboarding accessibility' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Reload samples', exact: true }).click();
  const confirmation = page.getByRole('dialog', { name: 'Reload sample data?' });
  await confirmation.getByRole('button', { name: 'Reload samples', exact: true }).click();
  await expect(confirmation).not.toBeVisible();
  await expect(
    page.getByRole('button', { name: originalTitle, exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: /^Open SPR-1101:/ })).toHaveCount(0);
  await expect(page.getByLabel('Sample data', { exact: true })).toContainText(
    '1,000 tasks',
  );

  // A full page reload also restores the JSON baseline; the authentication is retained.
  await page.getByRole('button', { name: 'New task', exact: true }).click();
  const create = page.getByRole('dialog', { name: 'Create task' });
  await create
    .getByLabel('Task title', { exact: false })
    .fill('Check sample refresh behavior');
  await create.getByRole('button', { name: 'Create task', exact: true }).click();
  await expect(create).not.toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Open SPR-1101: Check sample refresh behavior' }),
  ).toBeVisible();
  await page.reload();
  await expect(page).toHaveURL('/board');
  await expect(
    page.getByRole('button', { name: originalTitle, exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: /^Open SPR-1101:/ })).toHaveCount(0);
  await expect(page.getByLabel('Sample data', { exact: true })).toContainText(
    '1,000 tasks',
  );
}
