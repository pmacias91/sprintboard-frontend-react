import { expect, test } from '@playwright/test';
import { linkedTaskPath, verifyWorkspaceLinks } from './helpers/workspace-links';
import { verifyAuthSession, verifyLegacyLoginLink } from './helpers/auth-session';
import {
  verifyAsyncTaskRecovery,
  verifyPersonalBatches,
  verifySampleCollections,
  verifySampleRestoration,
} from './helpers/sample-data';

test('loads samples, edits tasks in memory, and restores the original dataset', async ({
  page,
}) => {
  const protectedPath = `${linkedTaskPath}#task`;
  await page.goto(protectedPath);
  const readableLogin =
    '/login?next=/board&priority=high&assignee=alex&task=SPR-106#task';
  await expect(page).toHaveURL(readableLogin);
  await page.goto(`/login?next=${encodeURIComponent(protectedPath)}`);
  await expect(page).toHaveURL(readableLogin);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Sign in', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Skip to content' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
  await expect(page).toHaveURL(readableLogin);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(
    page.getByText('Enter a valid email address.', { exact: true }),
  ).toBeVisible();
  await page.getByLabel('Email address').fill('user@sprintboard.com');
  await page.getByLabel('Password', { exact: true }).fill('wrong-password');
  await page.getByRole('button', { name: 'Show password', exact: true }).click();
  await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute(
    'type',
    'text',
  );
  await page.getByRole('button', { name: 'Hide password', exact: true }).click();
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Those details don’t match');
  await page.getByRole('button', { name: 'Use demo credentials' }).click();
  await expect(page.getByLabel('Email address')).toHaveValue('user@sprintboard.com');
  await expect(page.getByLabel('Password', { exact: true })).toHaveValue('user1234');
  await expect(
    page.getByRole('checkbox', { name: 'Keep me signed in' }),
  ).not.toBeChecked();
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(protectedPath);
  await verifyLegacyLoginLink(page, protectedPath);
  await verifyWorkspaceLinks(page);
  await verifySampleCollections(page);
  await expect(page.getByRole('button', { name: /Open SPR-101/ })).toBeVisible();
  const board = page.getByRole('region', { name: 'Task board', exact: true });
  const initialBounds = await board.boundingBox();
  expect(initialBounds).not.toBeNull();
  expect(initialBounds!.y).toBeLessThan(230);
  expect(initialBounds!.height).toBeGreaterThan(page.viewportSize()!.height * 0.65);

  const projectViews = page.getByRole('navigation', { name: 'Project views' });
  const search = page.getByRole('searchbox', { name: 'Search tasks' });
  const originalSearchBounds = await search.boundingBox();
  const originalActionBounds = await page
    .getByRole('button', { name: 'New task' })
    .boundingBox();

  await projectViews.getByRole('link', { name: /My Tasks/ }).click();
  const personalList = page.getByRole('region', { name: 'My tasks list' });
  await expect(personalList.getByRole('table')).toBeVisible();
  await verifyPersonalBatches(page);
  expect(await personalList.boundingBox()).toEqual(initialBounds);
  expect(await search.boundingBox()).toEqual(originalSearchBounds);
  expect(await page.getByRole('button', { name: 'New task' }).boundingBox()).toEqual(
    originalActionBounds,
  );
  await projectViews.getByRole('link', { name: /^Board/ }).click();

  await page.getByRole('button', { name: 'View sprint progress' }).click();
  const sprintSummary = page.getByRole('dialog', { name: 'Sprint overview' });
  await expect(sprintSummary).toBeVisible();
  await expect(sprintSummary.getByRole('progressbar')).toHaveAttribute(
    'aria-valuenow',
    '25',
  );
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: 'Enter focus mode' }).click();
  await expect(page.getByRole('button', { name: 'Exit focus mode' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(
    page.getByRole('navigation', { name: 'Main navigation' }),
  ).not.toBeVisible();
  const focusBounds = await board.boundingBox();
  expect(focusBounds!.y).toBeLessThan(initialBounds!.y);
  expect(focusBounds!.width).toBeGreaterThan(initialBounds!.width + 200);
  await projectViews.getByRole('link', { name: /My Tasks/ }).click();
  await expect(page.getByRole('button', { name: 'Exit focus mode' })).toBeVisible();
  expect(await personalList.boundingBox()).toEqual(focusBounds);
  await projectViews.getByRole('link', { name: /^Board/ }).click();
  await page.getByRole('button', { name: 'Exit focus mode' }).click();
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();

  await page.getByRole('button', { name: 'New task' }).click();
  const dialog = page.getByRole('dialog');
  await dialog
    .getByLabel('Task title', { exact: false })
    .fill('Verify the launch checklist');
  await dialog
    .getByLabel('Description', { exact: false })
    .fill('Confirm the team is ready to launch.');
  await dialog.getByLabel('Due date', { exact: false }).fill('2026-11-05');
  await dialog.getByRole('button', { name: 'Create task' }).click();
  await expect(dialog).not.toBeVisible();
  const card = page.getByRole('button', {
    name: 'Open SPR-1101: Verify the launch checklist',
  });
  await expect(
    page
      .getByRole('region', { name: 'To Do column' })
      .getByRole('button', { name: 'Open SPR-1101: Verify the launch checklist' }),
  ).toBeVisible();
  const inProgressColumn = page.getByRole('region', { name: 'In Progress column' });

  // The new card adds content to the board, without expanding the document.
  expect(
    await board.evaluate((element) => element.scrollHeight > element.clientHeight),
  ).toBe(true);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollHeight <= window.innerHeight,
    ),
  ).toBe(true);

  await card.dragTo(inProgressColumn.getByRole('heading'));
  const dragged = inProgressColumn.getByRole('button', {
    name: 'Open SPR-1101: Verify the launch checklist',
  });
  await expect(dragged).toBeVisible();
  await expect(inProgressColumn).toHaveAttribute('aria-busy', 'false');
  await expect(dialog).not.toBeVisible();
  await dragged.click();
  await expect(dialog.getByRole('combobox', { name: 'Status', exact: true })).toHaveText(
    'In Progress',
  );
  await dialog
    .getByLabel('Task title', { exact: false })
    .fill('Finalize the launch checklist');
  await dialog.getByRole('combobox', { name: 'Priority', exact: true }).click();
  await page.getByRole('option', { name: 'High', exact: true }).click();
  await dialog.getByRole('button', { name: 'Save changes' }).click();
  await expect(dialog).not.toBeVisible();
  const moved = page
    .getByRole('region', { name: 'In Progress column' })
    .getByRole('button', { name: 'Open SPR-1101: Finalize the launch checklist' });
  await expect(moved).toBeVisible();

  await verifyAsyncTaskRecovery(page);
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: /My Tasks/ })
    .click();
  const row = page.getByRole('row').filter({ hasText: 'SPR-1101' });
  await expect(row).toContainText('Finalize the launch checklist');
  await expect(row).toContainText('In Progress');
  await expect(row).toContainText('High');
  await expect(row).toContainText('Nov 5');
  await row
    .getByRole('button', { name: 'Open SPR-1101: Finalize the launch checklist' })
    .click();
  await expect(dialog.getByLabel('Description', { exact: false })).toHaveValue(
    'Confirm the team is ready to launch.',
  );
  await expect(dialog.getByLabel('Due date', { exact: false })).toHaveValue('2026-11-05');

  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'Board', exact: true })
    .click();
  await verifySampleRestoration(page);
  await page.setViewportSize({ width: 390, height: 844 });
  const mobileBounds = await board.boundingBox();
  expect(mobileBounds!.height).toBeGreaterThan(844 * 0.6);
  const mobileSearchBounds = await search.boundingBox();
  expect(mobileSearchBounds!.x).toBeGreaterThanOrEqual(18);
  expect(mobileSearchBounds!.x + mobileSearchBounds!.width).toBeLessThanOrEqual(372);
  expect(
    await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight),
  ).toBe(true);
  await projectViews.getByRole('link', { name: /My Tasks/ }).click();
  expect(await personalList.boundingBox()).toEqual(mobileBounds);
  expect(await search.boundingBox()).toEqual(mobileSearchBounds);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBe(true);
  await expect(page.getByRole('button', { name: 'Copy view link' })).toBeInViewport();
  await page.screenshot({ path: '.local/preview/shareable-my-tasks-mobile.png' });

  await verifyAuthSession(page);
});
