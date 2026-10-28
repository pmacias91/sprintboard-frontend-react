import { useLayoutEffect, useRef, useState } from 'react';
import { useIsMutating } from '@tanstack/react-query';
import { Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { CheckCheck, Columns3, LoaderCircle, X } from 'lucide-react';
import { AppShell } from './components/app-shell';
import { Button } from './components/ui/button';
import { Board } from './features/tasks/board';
import { ProjectHeader } from './features/tasks/project-header';
import { TaskToolbar } from './features/tasks/task-toolbar';
import { MyTasks } from './features/tasks/my-tasks';
import { TaskEditor, type EditorState } from './features/tasks/task-editor';
import {
  SAMPLE_RELOAD_KEY,
  TASK_WRITE_KEY,
  useMembers,
  useTasks,
} from './hooks/use-tasks';
import { CURRENT_USER_ID, priorities, type Status, type Task } from './types/task';
import { AuthProvider } from './features/auth/auth-provider';
import { RequireSession } from './features/auth/require-session';
import { LoginPage } from './features/auth/login-page';
import { useWorkspaceUrl } from './hooks/use-workspace-url';
import { copyLink } from './lib/copy-link';
import { TaskNotFound } from './features/tasks/task-not-found';

function Workspace() {
  const { pathname } = useLocation();
  const isMine = pathname === '/my-tasks';
  const tasks = useTasks();
  const members = useMembers();
  const writesPending = useIsMutating({ mutationKey: TASK_WRITE_KEY }) > 0;
  const reloadingSamples = useIsMutating({ mutationKey: SAMPLE_RELOAD_KEY }) > 0;
  const [newEditor, setNewEditor] = useState<EditorState | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const { view, updateView, openTask, closeTask, shareHref, viewLinks } = useWorkspaceUrl(
    members.data,
  );
  const { search, priority, assignee, showLabels, hideCompleted, sort, taskId } = view;
  const allTasks = tasks.data || [];
  const team = members.data || [];
  const mine = allTasks.filter((task) => task.assigneeId === CURRENT_USER_ID);
  const batchKey = JSON.stringify([
    isMine,
    search,
    priority,
    assignee,
    hideCompleted,
    sort,
  ]);
  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (viewport) {
      viewport.scrollTop = 0;
      viewport.scrollLeft = 0;
    }
  }, [batchKey]);
  const hasData = Boolean(tasks.data && members.data);
  const isRefreshing = tasks.isFetching || members.isFetching;
  const refresh = () => {
    if (!writesPending && !reloadingSamples) {
      void tasks.refetch();
      void members.refetch();
    }
  };
  const hasFilters =
    Boolean(search.trim()) ||
    priority !== 'all' ||
    (!isMine && assignee !== 'all') ||
    hideCompleted;
  const filtered = (isMine ? mine : allTasks)
    .filter((task) => {
      const query = search.trim().toLowerCase();
      return (
        (!query ||
          `${task.title} ${task.id} ${task.description} ${task.labels.join(' ')}`
            .toLowerCase()
            .includes(query)) &&
        (priority === 'all' || task.priority === priority) &&
        (isMine ||
          assignee === 'all' ||
          task.assigneeId === (assignee === 'unassigned' ? '' : assignee)) &&
        (!hideCompleted || task.status !== 'done')
      );
    })
    .sort((a, b) => {
      if (sort === 'priority') {
        return priorities.indexOf(a.priority) - priorities.indexOf(b.priority);
      }
      if (sort === 'due') {
        return (a.dueDate || '9999').localeCompare(b.dueDate || '9999');
      }
      return 0;
    });
  const readyForDetails = tasks.isSuccess && members.isSuccess;
  const linkedTask = taskId ? allTasks.find((task) => task.id === taskId) : undefined;
  const editor = taskId
    ? readyForDetails && linkedTask
      ? { task: linkedTask }
      : null
    : newEditor;

  const create = (status: Status = 'todo') => setNewEditor({ status });
  const open = (task: Task) => {
    setNewEditor(null);
    openTask(task.id);
  };
  const closeEditor = () => {
    setNewEditor(null);
    if (taskId) {
      closeTask();
    }
  };
  const clearFilters = () => {
    updateView({ search: '', priority: 'all', assignee: 'all', hideCompleted: false });
  };

  const taskToolbar = (
    <TaskToolbar
      isMine={isMine}
      members={team}
      search={search}
      priority={priority}
      assignee={assignee}
      sort={sort}
      showLabels={showLabels}
      hideCompleted={hideCompleted}
      hasFilters={hasFilters}
      onSearchChange={(value) => updateView({ search: value }, true)}
      onPriorityChange={(value) =>
        updateView({ priority: priorities.find((option) => option === value) ?? 'all' })
      }
      onAssigneeChange={(value) => updateView({ assignee: value })}
      onSortChange={(value) =>
        updateView({ sort: value === 'priority' || value === 'due' ? value : 'default' })
      }
      onShowLabelsChange={(value) => updateView({ showLabels: value })}
      onHideCompletedChange={(value) => updateView({ hideCompleted: value })}
      onClear={clearFilters}
      onCopyLink={() => {
        void copyLink(shareHref, 'View link copied');
      }}
    />
  );

  return (
    <AppShell
      currentUser={team.find((member) => member.id === CURRENT_USER_ID)}
      myTaskCount={mine.filter((task) => task.status !== 'done').length}
      contained
      focusMode={focusMode}
      viewLinks={viewLinks}
    >
      <main id="main-content" className="workspace-page" tabIndex={-1}>
        <ProjectHeader
          tasks={allTasks}
          members={team}
          focusMode={focusMode}
          onRefresh={refresh}
          isRefreshing={isRefreshing}
          canRefresh={!writesPending && !reloadingSamples}
          onToggleFocus={() => setFocusMode(!focusMode)}
          onCreate={() => create()}
          canCreate={hasData && !members.isError && !reloadingSamples}
        />
        <div className="workspace-controlbar">
          <nav className="view-tabs" aria-label="Project views">
            <NavLink to={viewLinks.board}>
              <Columns3 size={16} />
              Board<span>{allTasks.length}</span>
            </NavLink>
            <NavLink to={viewLinks.myTasks}>
              <CheckCheck size={16} />
              My Tasks<span>{mine.length}</span>
            </NavLink>
          </nav>
          {taskToolbar}
        </div>
        <div
          className={`workspace-viewport ${isMine ? 'tasks-viewport' : 'board-viewport'}`}
          ref={viewportRef}
          role="region"
          aria-label={isMine ? 'My tasks list' : 'Task board'}
          tabIndex={0}
          aria-busy={isRefreshing || reloadingSamples}
        >
          {hasData && (isRefreshing || reloadingSamples) && (
            <div className="sample-refresh-status" role="status">
              <LoaderCircle size={13} className="animate-spin" />
              {reloadingSamples ? 'Reloading samples…' : 'Refreshing tasks…'}
            </div>
          )}
          {hasData && (tasks.isError || members.isError) && (
            <div className="sample-refresh-error" role="alert">
              <span>{tasks.error?.message || members.error?.message}</span>
              <Button variant="outline" size="sm" onClick={refresh}>
                Try again
              </Button>
            </div>
          )}
          {hasFilters && (
            <div className="filter-summary" role="status">
              Showing {filtered.length} of {(isMine ? mine : allTasks).length} tasks
              {search.trim() ? ` matching “${search.trim()}”` : ''}
            </div>
          )}
          {tasks.isPending || members.isPending ? (
            <div
              className="board-grid loading-board"
              role="status"
              aria-label="Loading tasks"
            >
              {[0, 1, 2].map((column) => (
                <div key={column} className="loading-column">
                  <div className="skeleton skeleton-heading" />
                  {[0, 1, 2].map((card) => (
                    <div className="skeleton skeleton-card" key={card} />
                  ))}
                </div>
              ))}
              <span className="sr-only">Loading your workspace…</span>
            </div>
          ) : !hasData && (tasks.isError || members.isError) ? (
            <div className="page-error" role="alert">
              <span className="empty-icon">
                <X size={24} />
              </span>
              <h3>Unable to load tasks</h3>
              <p>{tasks.error?.message || members.error?.message}</p>
              <Button variant="outline" onClick={refresh}>
                Try again
              </Button>
            </div>
          ) : isMine ? (
            <MyTasks
              key={batchKey}
              tasks={filtered}
              onOpen={open}
              onCreate={() => create()}
              filtered={hasFilters}
            />
          ) : (
            <Board
              key={batchKey}
              tasks={filtered}
              members={team}
              onOpen={open}
              onCreate={create}
              showLabels={showLabels}
            />
          )}
        </div>
      </main>
      {editor && (
        <TaskEditor
          key={editor.task?.id || 'new-task'}
          editor={editor}
          members={team}
          onClose={closeEditor}
          onCopyLink={() => {
            void copyLink(shareHref, 'Task link copied');
          }}
        />
      )}
      {taskId && readyForDetails && !linkedTask && <TaskNotFound onClose={closeTask} />}
    </AppShell>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <a
        href="#main-content"
        className="skip-link"
        onClick={(event) => {
          const content = document.getElementById('main-content');

          if (content) {
            // Preserve any return destination fragment while moving keyboard focus.
            event.preventDefault();
            content.focus();
          }
        }}
      >
        Skip to content
      </a>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/board"
          element={
            <RequireSession>
              <Workspace />
            </RequireSession>
          }
        />
        <Route
          path="/my-tasks"
          element={
            <RequireSession>
              <Workspace />
            </RequireSession>
          }
        />
        <Route path="*" element={<Navigate to="/board" replace />} />
      </Routes>
    </AuthProvider>
  );
}
