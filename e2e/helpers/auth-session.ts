import { expect, type Page } from '@playwright/test';

export function expectedLoginPath(next: string): string {
  const url = new URL(next, 'http://localhost:5173');
  return `/login?next=${url.pathname}${url.search ? `&${url.search.slice(1)}` : ''}${url.hash}`;
}

export async function verifyLegacyLoginLink(page: Page, returnTo: string): Promise<void> {
  const destination = '/board?q=C%2B%2B+%26+100%25+%231&task=SPR-106#task';
  await page.goto(`/login?next=${encodeURIComponent(destination)}`);
  await expect(page).toHaveURL(destination);
  const dialog = page.getByRole('dialog', { name: 'Task details' });
  await expect(dialog.getByLabel('Task title', { exact: false })).toHaveValue(
    'Build the project dashboard',
  );
  await dialog.getByRole('button', { name: 'Close dialog' }).click();
  await expect(page.getByRole('searchbox', { name: 'Search tasks' })).toHaveValue(
    'C++ & 100% #1',
  );
  await page.goto(returnTo);
}

async function signIn(page: Page, rememberMe: boolean): Promise<void> {
  await page.getByRole('button', { name: 'Use demo credentials' }).click();
  await page.getByRole('checkbox', { name: 'Keep me signed in' }).setChecked(rememberMe);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
}

async function signOut(page: Page): Promise<void> {
  const navigation = page.getByRole('button', { name: 'Open navigation' });

  if (await navigation.isVisible()) {
    await navigation.click();
  }

  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
}

export async function verifyAuthSession(page: Page): Promise<void> {
  const context = page.context();
  const taskPath = '/my-tasks?priority=high&task=SPR-106';

  // The default session survives reloads, but is not shared with a new window.
  const isolated = await context.newPage();
  await isolated.goto(taskPath);
  await expect(isolated).toHaveURL(expectedLoginPath(taskPath));
  await isolated.close();

  await signOut(page);
  await expect(page).toHaveURL(expectedLoginPath('/my-tasks'));
  await page.goto(taskPath);
  await expect(page).toHaveURL(expectedLoginPath(taskPath));
  await page.reload();
  await expect(
    page.getByRole('checkbox', { name: 'Keep me signed in' }),
  ).not.toBeChecked();
  await page.screenshot({ path: '.local/preview/login-remember-mobile.png' });
  await signIn(page, true);
  await expect(page).toHaveURL(taskPath);
  const dialog = page.getByRole('dialog', { name: 'Task details' });
  await expect(dialog.getByLabel('Task title', { exact: false })).toHaveValue(
    'Build the project dashboard',
  );
  await dialog.getByRole('button', { name: 'Close dialog' }).click();

  const restored = await context.newPage();
  await restored.goto('/board');
  await expect(restored.getByRole('button', { name: /Open SPR-106:/ })).toBeVisible();
  await restored.close();

  const reopened = await context.newPage();
  await reopened.goto('/my-tasks');
  await expect(reopened.getByRole('row').filter({ hasText: 'SPR-106' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('row').filter({ hasText: 'SPR-106' })).toBeVisible();

  // Browser-restored local storage works with completely fresh session storage.
  const browser = context.browser();
  expect(browser).not.toBeNull();
  const restartedContext = await browser!.newContext({
    baseURL: 'http://localhost:5173',
    storageState: await context.storageState(),
  });

  try {
    const restarted = await restartedContext.newPage();
    await restarted.goto('/my-tasks');
    await expect(restarted.getByRole('row').filter({ hasText: 'SPR-106' })).toBeVisible();
    expect(await restarted.evaluate(() => sessionStorage.length)).toBe(0);

    // A remembered session has a fixed expiry, including after browser restore.
    await restarted.clock.setFixedTime(new Date(Date.now() + 31 * 24 * 60 * 60 * 1000));
    await restarted.reload();
    await expect(restarted).toHaveURL(expectedLoginPath('/my-tasks'));
  } finally {
    await restartedContext.close();
  }

  // Existing authenticated windows react to a sign-out without needing a reload.
  await signOut(reopened);
  await expect(reopened).toHaveURL(expectedLoginPath('/my-tasks'));
  await expect(page).toHaveURL(expectedLoginPath('/my-tasks?priority=high'));
  await expect(page.getByRole('region', { name: 'My tasks list' })).not.toBeVisible();
  await reopened.close();

  // Opting out after a persistent login must not leave a remembered session behind.
  await signIn(page, false);
  await expect(page).toHaveURL('/my-tasks?priority=high');
  const temporary = await context.newPage();
  await temporary.goto('/board');
  await expect(temporary).toHaveURL(expectedLoginPath('/board'));
  await temporary.close();

  for (const next of [
    'https://example.invalid/board',
    '//example.invalid/board',
    '/login',
  ]) {
    await page.goto(`/login?${new URLSearchParams({ next }).toString()}`);
    await expect(page).toHaveURL('/board');
  }
}
