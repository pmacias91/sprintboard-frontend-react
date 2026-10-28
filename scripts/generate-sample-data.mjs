import { mkdir, writeFile } from 'node:fs/promises';

// Retain the original demo tasks so existing deep links remain useful.
const originalTasks = [
  {
    description:
      'Create a welcoming first-run experience that helps new teams get to their first project. Explore the welcome screen, project setup, and invitation steps.',
    createdAt: '2026-10-19T09:00:00.000Z',
    id: 'SPR-101',
    title: 'Design the new onboarding flow',
    status: 'todo',
    priority: 'high',
    assigneeId: 'sarah',
    dueDate: '2026-10-29',
    labels: ['Design', 'UX'],
  },
  {
    description:
      'Add a clear verification step after sign-up, including success and expired-link states.',
    createdAt: '2026-10-19T09:00:00.000Z',
    id: 'SPR-102',
    title: 'Set up email verification',
    status: 'todo',
    priority: 'high',
    assigneeId: 'james',
    dueDate: '2026-10-30',
    labels: ['Backend'],
  },
  {
    description:
      'Design a small set of friendly empty states for the project list and task board.',
    createdAt: '2026-10-19T09:00:00.000Z',
    id: 'SPR-103',
    title: 'Create empty state illustrations',
    status: 'todo',
    priority: 'low',
    assigneeId: 'sarah',
    dueDate: '',
    labels: ['Design'],
  },
  {
    description:
      'Make every action reachable with the keyboard. Check focus order, visible focus states, and dialog focus restoration.',
    createdAt: '2026-10-19T09:00:00.000Z',
    id: 'SPR-104',
    title: 'Improve keyboard navigation',
    status: 'todo',
    priority: 'medium',
    assigneeId: 'alex',
    dueDate: '2026-10-30',
    labels: ['Frontend', 'Accessibility'],
  },
  {
    description:
      'Document the project and task endpoints with practical request and response examples.',
    createdAt: '2026-10-19T09:00:00.000Z',
    id: 'SPR-105',
    title: 'Write API documentation',
    status: 'todo',
    priority: 'low',
    assigneeId: '',
    dueDate: '',
    labels: ['Documentation'],
  },
  {
    description:
      'Bring the new dashboard designs to life with reusable components and responsive layouts. Include loading and empty states.',
    createdAt: '2026-10-19T09:00:00.000Z',
    id: 'SPR-106',
    title: 'Build the project dashboard',
    status: 'in-progress',
    priority: 'high',
    assigneeId: 'alex',
    dueDate: '2026-10-28',
    labels: ['Frontend'],
  },
  {
    description:
      'Investigate the session refresh flow and preserve the active session when a page is reloaded.',
    createdAt: '2026-10-19T09:00:00.000Z',
    id: 'SPR-107',
    title: 'Fix session timeout on refresh',
    status: 'in-progress',
    priority: 'urgent',
    assigneeId: 'james',
    dueDate: '2026-10-27',
    labels: ['Bug', 'Backend'],
  },
  {
    description:
      'Polish our shared buttons, inputs, badges, and dialogs. Document the default, hover, focus, and disabled states.',
    createdAt: '2026-10-19T09:00:00.000Z',
    id: 'SPR-108',
    title: 'Create the component library',
    status: 'in-progress',
    priority: 'medium',
    assigneeId: 'sarah',
    dueDate: '2026-10-29',
    labels: ['Design system'],
  },
  {
    description:
      'Support priority and assignee filters, and keep the board counts in sync with visible results.',
    createdAt: '2026-10-19T09:00:00.000Z',
    id: 'SPR-109',
    title: 'Connect task filters to the API',
    status: 'in-progress',
    priority: 'medium',
    assigneeId: 'mia',
    dueDate: '2026-10-29',
    labels: ['Frontend', 'Backend'],
  },
  {
    description:
      'Review the board and task list on smaller screens. Keep the most important actions within easy reach.',
    createdAt: '2026-10-19T09:00:00.000Z',
    id: 'SPR-110',
    title: 'Polish responsive layouts',
    status: 'in-progress',
    priority: 'medium',
    assigneeId: 'alex',
    dueDate: '2026-10-30',
    labels: ['Frontend'],
  },
  {
    description:
      'Agree on a calm, focused visual language: a neutral palette, a considered accent, and readable type.',
    createdAt: '2026-10-19T09:00:00.000Z',
    id: 'SPR-111',
    title: 'Define the visual direction',
    status: 'done',
    priority: 'high',
    assigneeId: 'sarah',
    dueDate: '2026-10-21',
    labels: ['Design'],
  },
  {
    description:
      'Create a consistent local workflow so everyone can get started quickly.',
    createdAt: '2026-10-19T09:00:00.000Z',
    id: 'SPR-112',
    title: 'Set up the development environment',
    status: 'done',
    priority: 'high',
    assigneeId: 'james',
    dueDate: '2026-10-20',
    labels: ['Engineering'],
  },
  {
    description:
      'Build the application shell and navigation between the board and personal task list.',
    createdAt: '2026-10-19T09:00:00.000Z',
    id: 'SPR-113',
    title: 'Implement the sidebar navigation',
    status: 'done',
    priority: 'medium',
    assigneeId: 'alex',
    dueDate: '2026-10-23',
    labels: ['Frontend'],
  },
  {
    description:
      'Review the proposed project, member, and task relationships with the engineering team.',
    createdAt: '2026-10-19T09:00:00.000Z',
    id: 'SPR-114',
    title: 'Review the database schema',
    status: 'done',
    priority: 'low',
    assigneeId: 'mia',
    dueDate: '2026-10-22',
    labels: ['Backend'],
  },
];

const users = [
  {
    id: 'alex',
    name: 'Alex Morgan',
    initials: 'AM',
    color: 'lavender',
    role: 'Frontend developer',
  },
  {
    id: 'sarah',
    name: 'Sarah Chen',
    initials: 'SC',
    color: 'peach',
    role: 'Product designer',
  },
  {
    id: 'james',
    name: 'James Wilson',
    initials: 'JW',
    color: 'sage',
    role: 'Backend developer',
  },
  {
    id: 'mia',
    name: 'Mia Patel',
    initials: 'MP',
    color: 'rose',
    role: 'Full-stack developer',
  },
  {
    id: 'noah',
    name: 'Noah Fischer',
    initials: 'NF',
    color: 'sage',
    role: 'QA engineer',
  },
  {
    id: 'emma',
    name: 'Emma Rossi',
    initials: 'ER',
    color: 'lavender',
    role: 'Frontend developer',
  },
  {
    id: 'leo',
    name: 'Leo Martin',
    initials: 'LM',
    color: 'peach',
    role: 'Platform engineer',
  },
  {
    id: 'ava',
    name: 'Ava Thompson',
    initials: 'AT',
    color: 'rose',
    role: 'Product manager',
  },
  {
    id: 'lucas',
    name: 'Lucas Silva',
    initials: 'LS',
    color: 'sage',
    role: 'Backend developer',
  },
  {
    id: 'sofia',
    name: 'Sofia Garcia',
    initials: 'SG',
    color: 'lavender',
    role: 'UX researcher',
  },
];

const areas = [
  [
    'workspace invitations',
    'Help teammates join the correct workspace and understand expired invitations.',
    ['Frontend', 'UX'],
  ],
  [
    'email templates',
    'Keep transactional emails readable across email clients, with clear actions and fallback text.',
    ['Backend', 'Design'],
  ],
  [
    'account preferences',
    'Let members update personal preferences without losing unsaved changes.',
    ['Frontend', 'UX'],
  ],
  [
    'project settings',
    'Keep project configuration understandable and consistent across workspace views.',
    ['Frontend', 'Backend'],
  ],
  [
    'member directory',
    'Make member profiles, roles, and availability easy to find as the team grows.',
    ['Frontend', 'Design'],
  ],
  [
    'task comments',
    'Keep discussions readable and preserve message context when a task changes.',
    ['Frontend', 'Backend'],
  ],
  [
    'saved views',
    'Let teammates return to useful filters and sorting without repeating setup.',
    ['Frontend', 'UX'],
  ],
  [
    'sprint planning',
    'Help the team review upcoming work and understand changes to the current sprint.',
    ['Frontend', 'Planning'],
  ],
  [
    'capacity reports',
    'Present planned work and team capacity with reliable totals and reporting periods.',
    ['Backend', 'Reporting'],
  ],
  [
    'release checklists',
    'Make release preparation explicit so owners can verify dependencies and completion criteria.',
    ['Engineering', 'Planning'],
  ],
  [
    'feature flags',
    'Keep rollout configuration understandable and feature availability consistent.',
    ['Backend', 'Engineering'],
  ],
  [
    'audit events',
    'Record important changes with reliable actor, resource, and timestamp information.',
    ['Backend', 'Security'],
  ],
  [
    'billing overview',
    'Make subscription details and invoice information easy to review without ambiguous totals.',
    ['Frontend', 'UX'],
  ],
  [
    'file uploads',
    'Show useful upload progress and keep file metadata consistent after interrupted transfers.',
    ['Frontend', 'Backend'],
  ],
  [
    'notification preferences',
    'Help members understand which events notify them and preserve their selected preferences.',
    ['Frontend', 'UX'],
  ],
  [
    'recurring work',
    'Represent recurring assignments clearly and prevent duplicate occurrences after retries.',
    ['Backend', 'Planning'],
  ],
  [
    'label management',
    'Keep labels discoverable and preserve references when they are renamed or removed.',
    ['Frontend', 'Design system'],
  ],
  [
    'assignment rules',
    'Explain ownership selection and handle assignments when members leave a project.',
    ['Backend', 'Planning'],
  ],
  [
    'activity feed',
    'Present recent changes in a consistent order and retain context as new entries arrive.',
    ['Frontend', 'Reporting'],
  ],
  [
    'board columns',
    'Keep task states and column totals consistent when work moves between columns.',
    ['Frontend', 'UX'],
  ],
  [
    'task editor',
    'Support reliable editing with clear validation and predictable recovery after failed saves.',
    ['Frontend', 'Forms'],
  ],
  [
    'personal task list',
    'Help teammates prioritize assigned work and review status, priority, and due dates together.',
    ['Frontend', 'UX'],
  ],
  [
    'search suggestions',
    'Keep suggestions useful when an earlier request returns after a newer search.',
    ['Frontend', 'Performance'],
  ],
  [
    'access roles',
    'Represent permissions clearly and keep restricted actions consistent across entry points.',
    ['Backend', 'Security'],
  ],
  [
    'integration settings',
    'Present connection health and configuration with useful recovery actions.',
    ['Frontend', 'Backend'],
  ],
  [
    'status transitions',
    'Keep state changes valid and preserve the prior state when an update fails.',
    ['Backend', 'Engineering'],
  ],
  [
    'analytics exports',
    'Generate consistent report exports and explain the selected filters and reporting period.',
    ['Backend', 'Reporting'],
  ],
  [
    'keyboard shortcuts',
    'Keep shortcut discovery predictable across dialogs and navigation.',
    ['Frontend', 'Accessibility'],
  ],
  [
    'offline recovery',
    'Preserve context during connection interruptions and make retry outcomes clear.',
    ['Frontend', 'Engineering'],
  ],
  [
    'session refresh',
    'Maintain the intended destination and session state while authentication refreshes.',
    ['Backend', 'Security'],
  ],
  [
    'API pagination',
    'Keep page boundaries and totals consistent when records change during navigation.',
    ['Backend', 'Performance'],
  ],
  [
    'query cache',
    'Synchronize cached data across views without overwriting newer edits with older responses.',
    ['Frontend', 'Performance'],
  ],
  [
    'design tokens',
    'Keep spacing, colors, and typography consistent across components and themes.',
    ['Design system', 'Design'],
  ],
  [
    'date controls',
    'Present due dates consistently across locales without shifting calendar dates.',
    ['Frontend', 'Forms'],
  ],
  [
    'bulk selection',
    'Make the scope of selected tasks clear when filters or result pages change.',
    ['Frontend', 'UX'],
  ],
  [
    'onboarding steps',
    'Help new teammates complete setup with useful progress and recoverable intermediate states.',
    ['Frontend', 'UX'],
  ],
  [
    'empty states',
    'Explain why tasks are not visible and provide a useful action for the current context.',
    ['Frontend', 'Design'],
  ],
  [
    'error pages',
    'Give users a clear recovery path when a page or resource cannot load.',
    ['Frontend', 'Accessibility'],
  ],
  [
    'route navigation',
    'Keep deep links, browser history, and visible navigation synchronized across views.',
    ['Frontend', 'Engineering'],
  ],
  [
    'deployment checks',
    'Make local release checks reproducible and report actionable build failures.',
    ['Engineering', 'Testing'],
  ],
];

const actions = [
  [
    'Audit keyboard navigation in',
    'Verify every action can be reached without a pointer.',
    'Tab order, Escape behavior, and visible focus states are documented and verified.',
    'Accessibility',
  ],
  [
    'Refine loading states for',
    'Provide a stable layout while data is being requested.',
    'Loading indicators remain readable without causing controls or content to jump.',
    'Frontend',
  ],
  [
    'Design empty states for',
    'Distinguish an empty dataset from filters returning no results.',
    'Each empty state explains the situation and offers an appropriate next action.',
    'Design',
  ],
  [
    'Handle failed requests in',
    'Keep the current context available when an asynchronous request fails.',
    'The failure presents a clear retry action and preserves entered values.',
    'Backend',
  ],
  [
    'Validate user input in',
    'Validate data at the form boundary and explain invalid values clearly.',
    'Invalid values cannot be submitted and errors are associated with their fields.',
    'Forms',
  ],
  [
    'Review responsive layouts for',
    'Review information hierarchy on narrow and wide viewports.',
    'Primary controls remain usable at 390px and 1440px without document overflow.',
    'UX',
  ],
  [
    'Document API contracts for',
    'Define request parameters, response fields, and expected error responses.',
    'Examples cover success, empty results, and validation failures.',
    'Documentation',
  ],
  [
    'Add integration coverage for',
    'Exercise the feature through its service and visible user interactions.',
    'Coverage verifies an observable outcome and a recoverable failure case.',
    'Testing',
  ],
  [
    'Optimize query caching for',
    'Review cache keys and invalidation after a successful mutation.',
    'Returning to an unchanged view reuses data and mutations update dependent views.',
    'Performance',
  ],
  [
    'Cancel stale requests in',
    'Ensure older requests cannot overwrite the latest user intent.',
    'Changing context cancels obsolete work and renders only the current response.',
    'Performance',
  ],
  [
    'Refine confirmation dialogs for',
    'Make the consequence and scope of each confirmed action explicit.',
    'Dialogs name the affected resource and restore focus after closing.',
    'UX',
  ],
  [
    'Check color contrast in',
    'Review text, icons, and state indicators against their backgrounds.',
    'Interactive states remain distinguishable without relying only on color.',
    'Accessibility',
  ],
  [
    'Improve error messages in',
    'Replace ambiguous failures with useful contextual explanations.',
    'Messages identify the failed action and provide a useful recovery step.',
    'UX',
  ],
  [
    'Review permission checks for',
    'Apply the same access decision at every entry point for an action.',
    'Restricted actions cannot be triggered through alternate navigation or a copied link.',
    'Security',
  ],
  [
    'Measure rendering cost in',
    'Profile updates with a representative dataset and identify repeated work.',
    'Frequent interactions stay responsive and expensive calculations have a documented cause.',
    'Performance',
  ],
  [
    'Preserve URL state for',
    'Keep navigable state in a shareable and validated URL.',
    'Reload and browser history restore the intended view and selected resource.',
    'Frontend',
  ],
  [
    'Simplify service boundaries for',
    'Keep data access separate from rendering and form behavior.',
    'Components consume typed results without depending on transport or storage details.',
    'Engineering',
  ],
  [
    'Support retry actions for',
    'Allow recovery from an interrupted request without repeating setup.',
    'Retry uses the current context and removes stale errors after success.',
    'Backend',
  ],
  [
    'Review data normalization in',
    'Keep identifiers and references consistent at the data boundary.',
    'Malformed records are rejected and related resources retain stable identifiers.',
    'Backend',
  ],
  [
    'Check date and timezone handling in',
    'Review parsing, formatting, and calendar boundaries across locales.',
    'Dates remain unchanged after saving and missing dates have an explicit display.',
    'Testing',
  ],
  [
    'Polish focus restoration in',
    'Restore keyboard focus to a useful location after temporary UI closes.',
    'Closing a dialog or popover returns focus to its initiating control when available.',
    'Accessibility',
  ],
  [
    'Verify pagination boundaries in',
    'Check first, last, and empty pages with changing datasets.',
    'Totals and navigation remain consistent after records are added or removed.',
    'Testing',
  ],
  [
    'Reduce duplicate requests in',
    'Avoid fetching the same unchanged resource more than necessary.',
    'Concurrent consumers share useful results and failed requests remain retryable.',
    'Performance',
  ],
  [
    'Add screen reader labels to',
    'Review accessible names and descriptions for interactive controls.',
    'Controls have meaningful names without repeated decorative text obscuring their purpose.',
    'Accessibility',
  ],
  [
    'Review optimistic updates for',
    'Keep immediate feedback consistent with confirmed server results.',
    'Successful updates settle cleanly and failed updates restore the previous state.',
    'Frontend',
  ],
  [
    'Document acceptance criteria for',
    'Make expected behavior understandable for implementation and review.',
    'Normal, loading, empty, and failure outcomes are explicit.',
    'Documentation',
  ],
];

let randomState = 0x5f3759df;

function random() {
  randomState += 0x6d2b79f5;
  let value = randomState;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
}

function shuffle(values) {
  const result = [...values];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }

  return result;
}

function remainingValues(targets, field) {
  const counts = new Map(Object.entries(targets));

  for (const task of originalTasks) {
    counts.set(task[field], counts.get(task[field]) - 1);
  }

  return shuffle(
    [...counts].flatMap(([value, count]) => {
      if (count < 0) {
        throw new Error('An original task exceeds the requested distribution.');
      }

      return Array(count).fill(value);
    }),
  );
}

const assignees = remainingValues(
  { ...Object.fromEntries(users.map((user) => [user.id, 90])), '': 100 },
  'assigneeId',
);
const statuses = remainingValues({ todo: 400, 'in-progress': 350, done: 250 }, 'status');
const priorities = remainingValues(
  { urgent: 100, high: 250, medium: 450, low: 200 },
  'priority',
);
const workItems = shuffle(
  areas.flatMap((area) => actions.map((action) => ({ area, action }))),
);
const tasks = structuredClone(originalTasks);

for (let index = 0; index < 1000 - originalTasks.length; index += 1) {
  const { area, action } = workItems[index];
  const status = statuses[index];
  const createdDay =
    status === 'done' ? 1 + Math.floor(random() * 36) : 20 + Math.floor(random() * 38);
  const createdAt = new Date('2026-09-01T08:00:00.000Z');
  createdAt.setUTCDate(createdDay);
  createdAt.setUTCHours(8 + Math.floor(random() * 9), Math.floor(random() * 4) * 15);
  const due = new Date(createdAt);
  due.setUTCDate(due.getUTCDate() + 2 + Math.floor(random() * 19));
  const dueDate = random() < 0.14 ? '' : due.toISOString().slice(0, 10);

  tasks.push({
    id: 'SPR-' + (115 + index),
    title: action[0] + ' ' + area[0],
    description: action[1] + ' ' + area[1] + '\n\nAcceptance criteria: ' + action[2],
    status,
    priority: priorities[index],
    assigneeId: assignees[index],
    dueDate,
    labels: [...new Set([...area[2], action[3]])].slice(0, 3),
    createdAt: createdAt.toISOString(),
  });
}

function countBy(field) {
  return tasks.reduce((counts, task) => {
    const key = task[field] || 'unassigned';
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function validate() {
  const userIds = new Set(users.map((user) => user.id));

  if (
    tasks.length !== 1000 ||
    users.length !== 10 ||
    userIds.size !== 10 ||
    new Set(tasks.map((task) => task.id)).size !== 1000 ||
    new Set(tasks.map((task) => task.title)).size !== 1000
  ) {
    throw new Error(
      'The sample dataset must contain 10 unique users and 1,000 unique tasks.',
    );
  }

  for (const [index, task] of tasks.entries()) {
    if (
      task.id !== 'SPR-' + (101 + index) ||
      task.title.length > 120 ||
      task.description.length > 4000 ||
      (task.assigneeId && !userIds.has(task.assigneeId)) ||
      Number.isNaN(Date.parse(task.createdAt)) ||
      (task.dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(task.dueDate))
    ) {
      throw new Error('Invalid sample task: ' + task.id);
    }
  }

  const assignmentCounts = countBy('assigneeId');

  if (
    users.some((user) => assignmentCounts[user.id] !== 90) ||
    assignmentCounts.unassigned !== 100
  ) {
    throw new Error('Every user must have 90 tasks, with 100 tasks left unassigned.');
  }
}

// Format the flat fixtures without adding a generator dependency.
function serializeRecords(records) {
  const serialized = records.map((record) => {
    const fields = Object.entries(record).map(([key, value]) => {
      const jsonValue = Array.isArray(value)
        ? '[' + value.map((item) => JSON.stringify(item)).join(', ') + ']'
        : JSON.stringify(value);
      return '    ' + JSON.stringify(key) + ': ' + jsonValue;
    });

    return '  {\n' + fields.join(',\n') + '\n  }';
  });

  return '[\n' + serialized.join(',\n') + '\n]\n';
}

validate();
const directory = new URL('../sample_data/', import.meta.url);
await mkdir(directory, { recursive: true });
await Promise.all([
  writeFile(new URL('users.json', directory), serializeRecords(users)),
  writeFile(new URL('tasks.json', directory), serializeRecords(tasks)),
]);

console.log(
  JSON.stringify(
    {
      tasks: tasks.length,
      users: users.length,
      byAssignee: countBy('assigneeId'),
      byStatus: countBy('status'),
      byPriority: countBy('priority'),
    },
    null,
    2,
  ),
);
