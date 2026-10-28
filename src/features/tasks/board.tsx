import { useState, type DragEvent } from 'react';
import { useIsMutating } from '@tanstack/react-query';
import { ArrowDown, ArrowUpRight, ChevronDown, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { StatusIcon } from '../../components/task-meta';
import { Button } from '../../components/ui/button';
import { Tooltip } from '../../components/ui/tooltip';
import {
  statusLabels,
  statuses,
  type Member,
  type Status,
  type Task,
} from '../../types/task';
import { TaskCard } from './task-card';
import { TASK_WRITE_KEY, useMoveTask } from '../../hooks/use-tasks';

const TASK_DRAG_TYPE = 'application/x-sprintboard-task';
const COLUMN_BATCH_SIZE = 30;

export function Board({
  tasks,
  members,
  onOpen,
  onCreate,
  showLabels,
}: {
  tasks: Task[];
  members: Member[];
  onOpen: (task: Task) => void;
  onCreate: (status: Status) => void;
  showLabels: boolean;
}) {
  const moveTask = useMoveTask();
  const writesPending = useIsMutating({ mutationKey: TASK_WRITE_KEY }) > 0;
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dropTarget, setDropTarget] = useState<Status | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const [visibleCounts, setVisibleCounts] = useState<Record<Status, number>>({
    todo: COLUMN_BATCH_SIZE,
    'in-progress': COLUMN_BATCH_SIZE,
    done: COLUMN_BATCH_SIZE,
  });

  function clearDrag() {
    setDraggedTask(null);
    setDropTarget(null);
  }

  function startDrag(event: DragEvent<HTMLButtonElement>, task: Task) {
    if (writesPending) {
      event.preventDefault();
      return;
    }

    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData(TASK_DRAG_TYPE, task.id);
    setDraggedTask(task);
    setAnnouncement(
      `Picked up ${task.id}. Drop it in another column to change its status.`,
    );
  }

  function allowDrop(event: DragEvent<HTMLElement>, status: Status) {
    if (!draggedTask || !event.dataTransfer.types.includes(TASK_DRAG_TYPE)) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDropTarget(status);
  }

  function dropTask(event: DragEvent<HTMLElement>, status: Status) {
    event.preventDefault();

    const task = draggedTask;
    const droppedId = event.dataTransfer.getData(TASK_DRAG_TYPE);
    clearDrag();

    if (!task || droppedId !== task.id || task.status === status || writesPending) {
      return;
    }

    setAnnouncement(`Saving ${task.id} in ${statusLabels[status]}.`);
    const destinationIndex = tasks
      .filter((candidate) => candidate.status === status || candidate.id === task.id)
      .findIndex((candidate) => candidate.id === task.id);
    setVisibleCounts((current) => ({
      ...current,
      [status]: Math.max(
        current[status],
        Math.ceil((destinationIndex + 1) / COLUMN_BATCH_SIZE) * COLUMN_BATCH_SIZE,
      ),
    }));
    moveTask.mutate(
      { id: task.id, status },
      {
        onSuccess: () => {
          const message = `${task.id} moved to ${statusLabels[status]}`;
          setAnnouncement(message);
          toast.success(message);
        },
        onError: (error) => {
          setAnnouncement(
            `Could not move ${task.id}. Its previous status has been restored.`,
          );
          toast.error('Couldn’t move task', { description: error.message });
        },
      },
    );
  }

  return (
    <div className={`board-grid ${draggedTask ? 'board-dragging' : ''}`}>
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </span>
      {statuses.map((status) => {
        const columnTasks = tasks.filter((task) => task.status === status);
        const visibleTasks = columnTasks.slice(0, visibleCounts[status]);
        const remaining = columnTasks.length - visibleTasks.length;
        return (
          <section
            className={`board-column column-${status} ${dropTarget === status && draggedTask?.status !== status ? 'column-drop-target' : ''}`}
            key={status}
            aria-label={`${statusLabels[status]} column`}
            aria-busy={writesPending}
            onDragOver={(event) => allowDrop(event, status)}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                setDropTarget(null);
              }
            }}
            onDrop={(event) => dropTask(event, status)}
          >
            <div className="column-header">
              <div className="column-heading">
                <h2>
                  <StatusIcon status={status} />
                  {statusLabels[status]}
                  <span className="column-count">{columnTasks.length}</span>
                </h2>
                <Tooltip label={`Add task to ${statusLabels[status]}`}>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onCreate(status)}
                    aria-label={`Add task to ${statusLabels[status]}`}
                  >
                    <Plus size={16} />
                  </Button>
                </Tooltip>
              </div>
              <div className="column-rule" />
            </div>
            <div className="column-cards">
              {visibleTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  members={members}
                  onOpen={onOpen}
                  showLabels={showLabels}
                  onDragStart={(event) => startDrag(event, task)}
                  onDragEnd={clearDrag}
                  isDragging={draggedTask?.id === task.id}
                  isMovePending={writesPending}
                />
              ))}
            </div>
            {columnTasks.length > 0 && (
              <div className="sample-batch-footer sample-column-batch">
                <span className="sample-batch-count" aria-live="polite">
                  {visibleTasks.length} of {columnTasks.length}
                </span>
                {remaining > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="sample-more-button"
                    aria-label={`Show more ${statusLabels[status]} tasks`}
                    onClick={() =>
                      setVisibleCounts((current) => ({
                        ...current,
                        [status]: current[status] + COLUMN_BATCH_SIZE,
                      }))
                    }
                  >
                    Show {Math.min(COLUMN_BATCH_SIZE, remaining)} more
                    <ChevronDown size={13} />
                  </Button>
                )}
              </div>
            )}
            {columnTasks.length === 0 && (
              <div className="column-empty">
                <span className="empty-icon">
                  {status === 'done' ? (
                    <ArrowUpRight size={21} />
                  ) : (
                    <ArrowDown size={21} />
                  )}
                </span>
                <p>{status === 'done' ? 'No completed tasks' : 'No tasks'}</p>
                <span>
                  {status === 'done'
                    ? 'Move completed tasks here.'
                    : 'Add a task or drag one here.'}
                </span>
              </div>
            )}
            <button
              type="button"
              className="add-column-task"
              onClick={() => onCreate(status)}
            >
              <Plus size={15} />
              Add task
            </button>
          </section>
        );
      })}
    </div>
  );
}
