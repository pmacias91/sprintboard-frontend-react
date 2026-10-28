import { useState } from 'react';
import {
  ArrowUpRight,
  CalendarDays,
  CheckCheck,
  ChevronDown,
  UserRound,
} from 'lucide-react';
import { PriorityBadge, StatusBadge } from '../../components/task-meta';
import { Button } from '../../components/ui/button';
import { formatDate, isOverdue } from '../../lib/utils';
import type { Task } from '../../types/task';

const TABLE_BATCH_SIZE = 25;

export function MyTasks({
  tasks,
  onOpen,
  onCreate,
  filtered,
}: {
  tasks: Task[];
  onOpen: (task: Task) => void;
  onCreate: () => void;
  filtered: boolean;
}) {
  const open = tasks.filter((task) => task.status !== 'done').length;
  const [visibleCount, setVisibleCount] = useState(TABLE_BATCH_SIZE);
  const visibleTasks = tasks.slice(0, visibleCount);
  const remaining = tasks.length - visibleTasks.length;
  return (
    <div className="my-tasks-view">
      <div className="personal-task-heading">
        <h2>
          <UserRound size={15} />
          Assigned to me<span className="column-count">{tasks.length}</span>
        </h2>
        <span>
          {open} open<span className="personal-task-separator">·</span>
          {tasks.length - open} completed
        </span>
      </div>
      {tasks.length > 0 ? (
        <div className="task-table-wrapper">
          <table className="task-table" aria-label="Tasks assigned to me">
            <thead>
              <tr>
                <th scope="col">Task</th>
                <th scope="col">Status</th>
                <th scope="col">Priority</th>
                <th scope="col">Due date</th>
                <th scope="col">
                  <span className="sr-only">Open</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleTasks.map((task) => (
                <tr key={task.id}>
                  <td>
                    <button
                      className="table-task-button"
                      onClick={() => onOpen(task)}
                      aria-label={`Open ${task.id}: ${task.title}`}
                    >
                      <span className="task-id">{task.id}</span>
                      <span className={task.status === 'done' ? 'completed-title' : ''}>
                        {task.title}
                      </span>
                    </button>
                  </td>
                  <td>
                    <StatusBadge status={task.status} />
                  </td>
                  <td>
                    <PriorityBadge priority={task.priority} />
                  </td>
                  <td>
                    <span
                      className={`table-date ${task.status !== 'done' && isOverdue(task.dueDate) ? 'overdue' : ''}`}
                    >
                      <CalendarDays size={13} />
                      {formatDate(task.dueDate)}
                    </span>
                  </td>
                  <td>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Open ${task.id}`}
                      onClick={() => onOpen(task)}
                    >
                      <ArrowUpRight size={15} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="list-empty">
          <CheckCheck size={32} />
          <h3>{filtered ? 'No tasks match your filters' : 'No tasks assigned to you'}</h3>
          <p>
            {filtered
              ? 'Try a different search or clear your filters.'
              : 'Tasks assigned to you will appear here.'}
          </p>
          <Button onClick={onCreate}>Create a task</Button>
        </div>
      )}
      {tasks.length > 0 && (
        <div className="sample-batch-footer sample-table-batch">
          <span className="sample-batch-count" aria-live="polite">
            {visibleTasks.length} of {tasks.length} tasks
          </span>
          {remaining > 0 && (
            <Button
              variant="outline"
              size="sm"
              aria-label="Show more assigned tasks"
              onClick={() => setVisibleCount((current) => current + TABLE_BATCH_SIZE)}
            >
              Show {Math.min(TABLE_BATCH_SIZE, remaining)} more
              <ChevronDown size={13} />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
