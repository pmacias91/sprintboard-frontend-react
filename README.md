# SprintBoard

A demo for organizing a team's tasks. Try the board, manage your tasks, and see
how the app handles loading data and failed saves.

## What's included

- A board with three statuses and a personal task list for the demo user.
- 1,000 sample tasks and 10 fictional users, loaded from JSON files in `sample_data`.
- Desktop and mobile layouts, with scrolling inside the workspace and a focus mode.

## What you can do

- Create and edit a task's title, description, status, priority, assignee, and due date.
- Delete tasks from their details, with confirmation before deletion.
- Drag cards between columns to change their status.
- Search, filter, sort, and show more tasks in batches.
- Copy links that preserve filters and the open task, including after signing in.
- Stay signed in across tabs during your browser session. Select **Keep me signed in**
  to stay signed in for up to 30 days after closing and reopening the browser.
- Simulate a slow connection or make the next save fail from **Sample data** options.
  If a drag-and-drop save fails, the card returns to its previous column.

## Current limits

- There is no real backend or database. The API and login are simulated; the 10 users
  are sample assignees, not accounts you can sign in with.
- The JSON files in `sample_data` are the baseline for each new session. Created
  tasks, edits, moves, and deletions are saved locally for that session and survive
  page reloads. **Keep me signed in** also preserves them across browser restarts,
  until the session expires (30 days) or you sign out. Without it, ending the browser
  session discards the changes. A new sign-in always starts from the JSON baseline.
  **Refresh tasks** keeps changes; **Reload samples** clears them and restores the
  original data, including deleted sample tasks. The JSON files are never modified.
  Tabs in the same session share saved data; refresh tasks to see another tab's edits.
  Changes are not shared with other browsers or people.
  If browser storage is blocked or full, the app falls back to memory and displays
  a warning that changes will be lost on reload. Invalid saved data falls back to
  the original samples. Clearing site data also removes saved tasks.
- Comments, attachments, subtasks, and multiple projects are not supported.

## Run locally

With Docker running:

```sh
docker compose up --build
```

Open [localhost:5173](http://localhost:5173) and sign in with
`user@sprintboard.com` / `user1234`, or click **Use demo credentials**.

To regenerate the sample JSON files: `npm run sample:generate` (requires Node.js 24+).

## Built with

React, TypeScript, Vite, React Router, TanStack Query, React Hook Form, Zod,
Tailwind CSS, Radix, and MSW. Tests use Vitest, React Testing Library, and Playwright.

## Checks and tests

```sh
docker compose exec frontend npm test
docker compose exec frontend npm run lint
docker compose exec frontend npm run build
```

For the full browser test, install Node.js 24+ and Google Chrome, then run:

```sh
npm ci
npm run test:e2e
```
