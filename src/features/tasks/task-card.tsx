import { CalendarDays, Check, ChevronRight } from 'lucide-react';
import { useRef, type DragEventHandler } from 'react';
import { Avatar, LabelBadge, PriorityBadge } from '../../components/task-meta';
import { formatDate, isOverdue } from '../../lib/utils';
import type { Member, Task } from '../../types/task';

interface TaskCardProps {
  task: Task;
  members: Member[];
  onOpen: (task: Task) => void;
  showLabels?: boolean;
  onDragStart?: DragEventHandler<HTMLButtonElement>;
  onDragEnd?: DragEventHandler<HTMLButtonElement>;
  isDragging?: boolean;
  isMovePending?: boolean;
}

export function TaskCard({
  task,
  members,
  onOpen,
  showLabels = true,
  onDragStart,
  onDragEnd,
  isDragging = false,
  isMovePending = false,
}: TaskCardProps) {
  const suppressClickUntil = useRef(0);

  return (
    <button
      type="button"
      className={`task-card ${task.status === 'done' ? 'task-card-done' : ''} ${isDragging ? 'task-card-dragging' : ''}`}
      draggable={Boolean(onDragStart) && !isMovePending}
      onDragStart={onDragStart}
      onDragEnd={(event) => {
        // A drop must not accidentally activate the task detail button.
        suppressClickUntil.current = performance.now() + 150;
        onDragEnd?.(event);
      }}
      onClick={() => {
        if (!isMovePending && performance.now() >= suppressClickUntil.current) {
          onOpen(task);
        }
      }}
      aria-label={`Open ${task.id}: ${task.title}`}
      aria-disabled={isMovePending}
    >
      <span className="task-card-top">
        <span className="task-id">{task.id}</span>
        <span className="card-open" aria-hidden="true">
          <ChevronRight size={15} />
        </span>
      </span>
      <span className="task-card-title">{task.title}</span>
      {showLabels && task.labels.length > 0 && (
        <span className="task-labels">
          {task.labels.map((label) => (
            <LabelBadge key={label} label={label} />
          ))}
        </span>
      )}
      <span className="task-card-footer">
        <PriorityBadge priority={task.priority} />
        <Avatar member={members.find((member) => member.id === task.assigneeId)} small />
      </span>
      {task.dueDate && (
        <span
          className={`task-card-date ${task.status !== 'done' && isOverdue(task.dueDate) ? 'overdue' : ''}`}
        >
          {task.status === 'done' ? <Check size={12} /> : <CalendarDays size={12} />}
          {task.status === 'done' ? 'Completed' : formatDate(task.dueDate)}
        </span>
      )}
    </button>
  );
}
