import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  readWorkspaceView,
  workspaceHref,
  writeWorkspaceView,
  type WorkspacePath,
  type WorkspaceView,
} from '../lib/workspace-url';
import type { Member } from '../types/task';

export function useWorkspaceUrl(members?: Member[]) {
  const location = useLocation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const path: WorkspacePath = location.pathname === '/my-tasks' ? '/my-tasks' : '/board';
  const view = readWorkspaceView(params, members);

  function updateView(changes: Partial<WorkspaceView>, replace = false) {
    // A single navigation makes compound changes (such as clearing filters) atomic.
    setParams(
      (current) =>
        writeWorkspaceView({ ...readWorkspaceView(current, members), ...changes }),
      { replace, preventScrollReset: true, state: null },
    );
  }

  function openTask(taskId: string) {
    const origin = workspaceHref(path, { ...view, taskId: null });

    navigate(workspaceHref(path, { ...view, taskId }), {
      preventScrollReset: true,
      state: { taskDialogOrigin: origin },
    });
  }

  function closeTask() {
    const state = location.state as { taskDialogOrigin?: unknown } | null;
    const origin = workspaceHref(path, { ...view, taskId: null });

    if (state?.taskDialogOrigin === origin) {
      // In-app openings return to the preceding view, keeping Forward useful.
      navigate(-1);
    } else {
      // A pasted link must close in place, rather than navigate to an external page.
      updateView({ taskId: null }, true);
    }
  }

  return {
    view,
    updateView,
    openTask,
    closeTask,
    shareHref: workspaceHref(path, view),
    viewLinks: {
      board: workspaceHref('/board', { ...view, taskId: null }),
      // Personal tasks have an implicit assignee; retain the shared filters only.
      myTasks: workspaceHref('/my-tasks', { ...view, assignee: 'all', taskId: null }),
    },
  };
}
