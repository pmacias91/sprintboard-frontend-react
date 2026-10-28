import { priorities, type Member } from '../types/task';

const priorityOptions = ['all', ...priorities] as const;
const sortOptions = ['default', 'priority', 'due'] as const;

export type WorkspacePath = '/board' | '/my-tasks';

export interface WorkspaceView {
  search: string;
  priority: (typeof priorityOptions)[number];
  assignee: string;
  sort: (typeof sortOptions)[number];
  hideCompleted: boolean;
  showLabels: boolean;
  taskId: string | null;
}

function readOption<T extends string>(
  value: string | null,
  options: readonly T[],
  fallback: T,
): T {
  return options.find((option) => option === value) ?? fallback;
}

export function readWorkspaceView(
  params: URLSearchParams,
  members?: Member[],
): WorkspaceView {
  const requestedAssignee = params.get('assignee') || 'all';
  const validAssignee =
    requestedAssignee === 'all' ||
    requestedAssignee === 'unassigned' ||
    !members ||
    members.some((member) => member.id === requestedAssignee);

  return {
    search: params.get('q') ?? '',
    priority: readOption(params.get('priority'), priorityOptions, 'all'),
    assignee: validAssignee ? requestedAssignee : 'all',
    sort: readOption(params.get('sort'), sortOptions, 'default'),
    hideCompleted: params.get('hideDone') === '1',
    showLabels: params.get('labels') !== '0',
    taskId: params.get('task')?.trim().toUpperCase() || null,
  };
}

export function writeWorkspaceView(view: WorkspaceView): URLSearchParams {
  const params = new URLSearchParams();

  if (view.search) {
    params.set('q', view.search);
  }
  if (view.priority !== 'all') {
    params.set('priority', view.priority);
  }
  if (view.assignee !== 'all') {
    params.set('assignee', view.assignee);
  }
  if (view.sort !== 'default') {
    params.set('sort', view.sort);
  }
  if (view.hideCompleted) {
    params.set('hideDone', '1');
  }
  if (!view.showLabels) {
    params.set('labels', '0');
  }
  if (view.taskId) {
    params.set('task', view.taskId);
  }

  return params;
}

export function workspaceHref(path: WorkspacePath, view: WorkspaceView): string {
  const params = writeWorkspaceView(view);
  return `${path}${params.size ? `?${params.toString()}` : ''}`;
}
