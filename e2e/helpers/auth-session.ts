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

  // Pasting a link into a new tab shares the login, even without "Keep me signed in".
  const shared = await context.newPage();
  await shared.goto(taskPath);
  await expect(shared).toHaveURL(taskPath);
  await expect(shared.getByRole('dialog', { name: 'Task details' })).toBeVisible();
  await shared.reload();
  await expect(shared.getByRole('dialog', { name: 'Task details' })).toBeVisible();
  const temporaryCookie = (await context.cookies()).find(
    (cookie) => cookie.name === 'sprintboard.session.v3',
  );
  expect(temporaryCookie?.expires).toBe(-1);

  const browser = context.browser();
  expect(browser).not.toBeNull();
  const temporaryState = await context.storageState();
  // A fresh browser session retains persistent data, but drops session-only cookies.
  const freshContext = await browser!.newContext({
    baseURL: 'http://localhost:5173',
    storageState: {
      ...temporaryState,
      cookies: temporaryState.cookies.filter((cookie) => cookie.expires !== -1),
    },
  });
  try {
    const fresh = await freshContext.newPage();
    await fresh.goto(taskPath);
    await expect(fresh).toHaveURL(expectedLoginPath(taskPath));
  } finally {
    await freshContext.close();
  }

  await signOut(page);
  await expect(page).toHaveURL(expectedLoginPath('/my-tasks'));
  await expect(shared).toHaveURL(expectedLoginPath(taskPath));
  await page.goto(taskPath);
  await expect(page).toHaveURL(expectedLoginPath(taskPath));
  await page.reload();
  await expect(
    page.getByRole('checkbox', { name: 'Keep me signed in' }),
  ).not.toBeChecked();
  await page.screenshot({ path: '.local/preview/login-remember-mobile.png' });
  await signIn(page, true);
  await expect(page).toHaveURL(taskPath);
  await expect(shared).toHaveURL(taskPath);
  await expect(shared.getByRole('dialog', { name: 'Task details' })).toBeVisible();
  await shared.close();
  const dialog = page.getByRole('dialog', { name: 'Task details' });
  await expect(dialog.getByLabel('Task title', { exact: false })).toHaveValue(
    'Build the project dashboard',
  );
  await dialog.getByRole('button', { name: 'Close dialog' }).click();

  const reopened = await context.newPage();
  await reopened.goto('/my-tasks');
  await expect(reopened.getByRole('row').filter({ hasText: 'SPR-106' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('row').filter({ hasText: 'SPR-106' })).toBeVisible();

  // A remembered session survives a new browser session with no session-only cookies.
  const rememberedState = await context.storageState();
  const rememberedCookie = rememberedState.cookies.find(
    (cookie) => cookie.name === 'sprintboard.session.v3',
  );
  expect(rememberedCookie?.expires).toBeGreaterThan(Date.now() / 1000);
  const restartedContext = await browser!.newContext({
    baseURL: 'http://localhost:5173',
    storageState: {
      ...rememberedState,
      cookies: rememberedState.cookies.filter((cookie) => cookie.expires !== -1),
    },
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

  // Opting out keeps cross-tab access, without leaving a persistent cookie behind.
  await signIn(page, false);
  await expect(page).toHaveURL('/my-tasks?priority=high');
  expect(
    (await context.cookies()).find((cookie) => cookie.name === 'sprintboard.session.v3')
      ?.expires,
  ).toBe(-1);

  for (const next of [
    'https://example.invalid/board',
    '//example.invalid/board',
    '/login',
  ]) {
    await page.goto(`/login?${new URLSearchParams({ next }).toString()}`);
    await expect(page).toHaveURL('/board');
  }
}
