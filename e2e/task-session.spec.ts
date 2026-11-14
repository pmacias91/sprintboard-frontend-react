import { expect, test, type Page } from '@playwright/test';

async function signIn(page: Page, remember: boolean) {
  await page.getByRole('button', { name: 'Use demo credentials' }).click();
  await page.getByRole('checkbox', { name: 'Keep me signed in' }).setChecked(remember);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByLabel('Sample data', { exact: true })).toContainText(
    '1,000 tasks',
  );
}

test('deletes a task on mobile with an accessible confirmation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/board');
  await signIn(page, false);
  await page.getByRole('button', { name: /^Open SPR-101:/ }).click();
  const editor = page.getByRole('dialog', { name: 'Task details' });
  const deleteButton = editor.getByRole('button', { name: 'Delete task' });
  await deleteButton.scrollIntoViewIfNeeded();
  await expect(deleteButton).toBeInViewport();
  await page.screenshot({ path: '.local/preview/delete-task-editor-mobile.png' });
  await deleteButton.click();
  const confirmation = page.getByRole('dialog', { name: 'Delete task?' });
  await expect(confirmation.getByRole('button', { name: 'Cancel' })).toBeFocused();
  await expect(
    confirmation.getByRole('button', { name: 'Delete task' }),
  ).toBeInViewport();
  await page.screenshot({ path: '.local/preview/delete-task-confirm-mobile.png' });
  await confirmation.getByRole('button', { name: 'Delete task' }).click();
  await expect(page.getByLabel('Sample data', { exact: true })).toContainText(
    '999 tasks',
  );
  await page.reload();
  await expect(page.getByRole('button', { name: /^Open SPR-101:/ })).toHaveCount(0);
});

for (const remember of [false, true]) {
  test(`task changes follow the ${remember ? 'remembered' : 'temporary'} session`, async ({
    page,
    browser,
  }) => {
    await page.goto('/board');
    await signIn(page, remember);
    await page.getByRole('button', { name: /^Open SPR-101:/ }).click();
    const editor = page.getByRole('dialog', { name: 'Task details' });
    await editor.getByRole('button', { name: 'Delete task' }).click();
    let confirmation = page.getByRole('dialog', { name: 'Delete task?' });
    await confirmation.getByRole('button', { name: 'Cancel' }).click();
    await expect(editor).toBeVisible();
    await editor.getByRole('button', { name: 'Delete task' }).click();
    confirmation = page.getByRole('dialog', { name: 'Delete task?' });
    await confirmation.getByRole('button', { name: 'Delete task' }).click();
    await expect(confirmation).not.toBeVisible();
    await expect(page).toHaveURL('/board');
    await page.reload();
    await expect(page.getByLabel('Sample data', { exact: true })).toContainText(
      '999 tasks',
    );
    await expect(page.getByRole('button', { name: /^Open SPR-101:/ })).toHaveCount(0);

    const tab = await page.context().newPage();
    await tab.goto('/board');
    await expect(tab.getByLabel('Sample data', { exact: true })).toContainText(
      '999 tasks',
    );
    await tab.close();

    // Simulate browser shutdown: retain localStorage, drop session-only cookies.
    const state = await page.context().storageState();
    const restarted = await browser.newContext({
      baseURL: 'http://localhost:5173',
      storageState: {
        ...state,
        cookies: state.cookies.filter((cookie) => cookie.expires !== -1),
      },
    });
    try {
      const reopened = await restarted.newPage();
      await reopened.goto('/board');
      if (remember) {
        await expect(reopened.getByLabel('Sample data', { exact: true })).toContainText(
          '999 tasks',
        );
        await expect(
          reopened.getByRole('button', { name: /^Open SPR-101:/ }),
        ).toHaveCount(0);
        await reopened.getByRole('button', { name: 'Sign out', exact: true }).click();
      }
      await expect(reopened).toHaveURL('/login?next=/board');
      await signIn(reopened, false);
      await expect(
        reopened.getByRole('button', { name: /^Open SPR-101:/ }),
      ).toBeVisible();
    } finally {
      await restarted.close();
    }

    await page.getByRole('button', { name: 'Sign out', exact: true }).click();
    await expect(page).toHaveURL('/login?next=/board');
    await signIn(page, false);
    await expect(page.getByRole('button', { name: /^Open SPR-101:/ })).toBeVisible();
  });
}
