import { expect, type Page } from '@playwright/test';

export const linkedTaskPath = '/board?priority=high&assignee=alex&task=SPR-106';

export async function verifyWorkspaceLinks(page: Page) {
  const dialog = page.getByRole('dialog', { name: 'Task details' });
  const search = page.getByRole('searchbox', { name: 'Search tasks' });
  const priority = page.getByRole('combobox', { name: 'Filter by priority' });
  const assignee = page.getByRole('combobox', { name: 'Filter by assignee' });
  const sort = page.getByRole('combobox', { name: 'Sort tasks' });
  const views = page.getByRole('navigation', { name: 'Project views' });

  // A protected, pasted link survives sign-in and a full reload.
  await expect(dialog.getByLabel('Task title', { exact: false })).toHaveValue(
    'Build the project dashboard',
  );
  await page.reload();
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Close dialog' }).click();
  await expect(page).toHaveURL('/board?priority=high&assignee=alex');
  await page.getByRole('button', { name: 'Clear', exact: true }).click();
  await expect(page).toHaveURL('/board');
  await expect(priority).toHaveText('Priority');
  await expect(assignee).toContainText('Assignee');

  await search.fill('dashboard');
  await expect(search).toHaveValue('dashboard');
  await expect(page).toHaveURL('/board?q=dashboard');
  await priority.click();
  await page.getByRole('option', { name: 'High', exact: true }).click();
  await assignee.click();
  await page.getByRole('option', { name: 'Alex Morgan (you)', exact: true }).click();
  await sort.click();
  await page.getByRole('option', { name: 'Due date', exact: true }).click();
  await page.getByRole('button', { name: 'Display options' }).click();
  await page.getByRole('checkbox', { name: 'Show card labels' }).uncheck();
  await page.getByRole('checkbox', { name: 'Hide completed tasks' }).check();
  await page.keyboard.press('Escape');

  const filteredPath =
    '/board?q=dashboard&priority=high&assignee=alex&sort=due&hideDone=1&labels=0';
  await expect(page).toHaveURL(filteredPath);
  await page.reload();
  await expect(search).toHaveValue('dashboard');
  await expect(priority).toHaveText('High');
  await expect(assignee).toContainText('Alex Morgan (you)');
  await expect(sort).toHaveText('Due date');
  await page.getByRole('button', { name: 'Display options' }).click();
  await expect(
    page.getByRole('checkbox', { name: 'Show card labels' }),
  ).not.toBeChecked();
  await expect(
    page.getByRole('checkbox', { name: 'Hide completed tasks' }),
  ).toBeChecked();
  await page.keyboard.press('Escape');

  // Capture copy requests without reading or changing the user's real clipboard.
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          document.documentElement.dataset.copiedLink = text;
        },
      },
    });
  });
  await page.getByRole('button', { name: 'Copy view link' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-copied-link', page.url());

  await page.getByRole('button', { name: /Open SPR-106:/ }).click();
  await expect(page).toHaveURL(`${filteredPath}&task=SPR-106`);
  await dialog.getByRole('button', { name: 'Copy task link' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-copied-link', page.url());
  await page.screenshot({ path: '.local/preview/shareable-task-desktop.png' });
  await page.goBack();
  await expect(dialog).not.toBeVisible();
  await expect(page).toHaveURL(filteredPath);
  await page.goForward();
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page).toHaveURL(filteredPath);

  await views.getByRole('link', { name: /My Tasks/ }).click();
  await expect(page).toHaveURL(
    '/my-tasks?q=dashboard&priority=high&sort=due&hideDone=1&labels=0',
  );
  await expect(page.getByRole('row').filter({ hasText: 'SPR-106' })).toBeVisible();
  await expect(search).toHaveValue('dashboard');
  await views.getByRole('link', { name: /^Board/ }).click();
  await expect(assignee).toContainText('Assignee');
  await page.getByRole('button', { name: 'Clear', exact: true }).click();
  await sort.click();
  await page.getByRole('option', { name: 'Default order', exact: true }).click();
  await page.getByRole('button', { name: 'Display options' }).click();
  await page.getByRole('checkbox', { name: 'Show card labels' }).check();
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL('/board');

  // Invalid filters fall back to defaults; a missing task can close in place.
  await page.goto(
    '/board?priority=invalid&assignee=missing&sort=invalid&hideDone=true&labels=invalid&task=SPR-9999',
  );
  const missing = page.getByRole('dialog', { name: 'Task not found' });
  await expect(missing).toBeVisible();
  await missing.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(page).toHaveURL('/board');
  await expect(priority).toHaveText('Priority');
  await expect(assignee).toContainText('Assignee');
  await expect(sort).toHaveText('Default order');
  await expect(page.getByRole('button', { name: /Open SPR-101:/ })).toBeVisible();
  await page.screenshot({ path: '.local/preview/shareable-board-desktop.png' });
}
