import { Controller, useForm } from 'react-hook-form';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  Link2,
  LoaderCircle,
  Plus,
  Trash2,
  UserRound,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Select } from '../../components/ui/select';
import { Tooltip } from '../../components/ui/tooltip';
import { Avatar, LabelBadge, PriorityIcon, StatusIcon } from '../../components/task-meta';
import { useDeleteTask, useSaveTask } from '../../hooks/use-tasks';
import {
  CURRENT_USER_ID,
  priorities,
  priorityLabels,
  statuses,
  statusLabels,
  taskSchema,
  type Member,
  type Status,
  type Task,
  type TaskInput,
} from '../../types/task';

export interface EditorState {
  task?: Task;
  status?: Status;
}

export function TaskEditor({
  editor,
  members,
  onClose,
  onCopyLink,
}: {
  editor: EditorState;
  members: Member[];
  onClose: () => void;
  onCopyLink?: () => void;
}) {
  const task = editor.task;
  const save = useSaveTask(task?.id);
  const remove = useDeleteTask();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const busy = save.isPending || remove.isPending;
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<TaskInput>({
    resolver: zodResolver(taskSchema),
    defaultValues: task
      ? {
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          assigneeId: task.assigneeId,
          dueDate: task.dueDate,
        }
      : {
          title: '',
          description: '',
          status: editor.status || 'todo',
          priority: 'medium',
          assigneeId: CURRENT_USER_ID,
          dueDate: '',
        },
  });

  const submit = handleSubmit(async (values) => {
    try {
      const saved = await save.mutateAsync(values);
      toast.success(task ? `${saved.id} updated` : `${saved.id} created`, {
        description: task ? 'Your changes are saved.' : 'Task added to the board.',
      });
      onClose();
    } catch {
      /* The form keeps its values and displays the mutation error. */
    }
  });

  async function deleteTask() {
    if (!task) {
      return;
    }
    try {
      await remove.mutateAsync(task.id);
      toast.success(`${task.id} deleted`, {
        description: 'Task removed from the board.',
      });
      onClose();
    } catch {
      // Keep the confirmation open so the user can retry or cancel.
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) {
          onClose();
        }
      }}
    >
      <DialogContent
        className="task-editor"
        onEscapeKeyDown={(event) => {
          if (busy) {
            event.preventDefault();
          }
        }}
        onPointerDownOutside={(event) => {
          if (busy) {
            event.preventDefault();
          }
        }}
      >
        {task && onCopyLink && (
          <Tooltip label="Copy task link">
            <Button
              variant="ghost"
              size="icon"
              className="task-copy-link"
              aria-label="Copy task link"
              onClick={onCopyLink}
            >
              <Link2 size={16} />
            </Button>
          </Tooltip>
        )}
        <div className="editor-eyebrow">
          <span className="project-icon-mini">
            <ArrowUpRight size={13} />
          </span>
          Platform launch<span className="breadcrumb-divider">/</span>
          <span>{task?.id || 'New task'}</span>
        </div>
        <DialogTitle className="editor-heading">
          {task ? 'Task details' : 'Create task'}
        </DialogTitle>
        <DialogDescription className="editor-description">
          Fields marked * are required.
        </DialogDescription>
        <form
          onSubmit={(event) => {
            void submit(event);
          }}
          className="editor-form"
        >
          <fieldset disabled={busy}>
            <div className="form-field">
              <label htmlFor="task-title">
                Task title <span className="required">*</span>
              </label>
              <input
                id="task-title"
                className="form-input title-input"
                placeholder="What needs to be done?"
                autoFocus
                {...register('title')}
                aria-invalid={Boolean(errors.title)}
                aria-describedby={errors.title ? 'title-error' : undefined}
              />
              {errors.title && (
                <p className="field-error" id="title-error" role="alert">
                  {errors.title.message}
                </p>
              )}
            </div>
            <div className="form-field">
              <label htmlFor="task-description">
                Description <span className="optional">optional</span>
              </label>
              <textarea
                id="task-description"
                className="form-input"
                placeholder="Describe the task."
                rows={5}
                {...register('description')}
                aria-invalid={Boolean(errors.description)}
                aria-describedby={errors.description ? 'description-error' : undefined}
              />
              {errors.description && (
                <p className="field-error" id="description-error" role="alert">
                  {errors.description.message}
                </p>
              )}
            </div>
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="task-status">Status</label>
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select
                      id="task-status"
                      label="Status"
                      value={field.value}
                      onValueChange={field.onChange}
                      options={statuses.map((status) => ({
                        value: status,
                        label: statusLabels[status],
                        icon: <StatusIcon status={status} />,
                      }))}
                    />
                  )}
                />
              </div>
              <div className="form-field">
                <label htmlFor="task-priority">Priority</label>
                <Controller
                  control={control}
                  name="priority"
                  render={({ field }) => (
                    <Select
                      id="task-priority"
                      label="Priority"
                      value={field.value}
                      onValueChange={field.onChange}
                      options={priorities.map((priority) => ({
                        value: priority,
                        label: priorityLabels[priority],
                        icon: <PriorityIcon priority={priority} />,
                      }))}
                    />
                  )}
                />
              </div>
              <div className="form-field">
                <label htmlFor="task-assignee">Assignee</label>
                <Controller
                  control={control}
                  name="assigneeId"
                  render={({ field }) => (
                    <Select
                      id="task-assignee"
                      label="Assignee"
                      value={field.value || 'unassigned'}
                      onValueChange={(value) =>
                        field.onChange(value === 'unassigned' ? '' : value)
                      }
                      options={[
                        {
                          value: 'unassigned',
                          label: 'Unassigned',
                          icon: <UserRound size={15} />,
                        },
                        ...members.map((member) => ({
                          value: member.id,
                          label: `${member.name}${member.id === CURRENT_USER_ID ? ' (you)' : ''}`,
                          icon: <Avatar member={member} small />,
                        })),
                      ]}
                    />
                  )}
                />
              </div>
              <div className="form-field">
                <label htmlFor="task-due">
                  Due date <CalendarDays size={13} />
                </label>
                <input
                  id="task-due"
                  className="form-input"
                  type="date"
                  {...register('dueDate')}
                  aria-invalid={Boolean(errors.dueDate)}
                  aria-describedby={errors.dueDate ? 'date-error' : undefined}
                />
                {errors.dueDate && (
                  <p className="field-error" id="date-error" role="alert">
                    {errors.dueDate.message}
                  </p>
                )}
              </div>
            </div>
            {task && task.labels.length > 0 && (
              <div className="form-field">
                <span className="field-label">Labels</span>
                <div className="task-labels">
                  {task.labels.map((label) => (
                    <LabelBadge key={label} label={label} />
                  ))}
                </div>
              </div>
            )}
          </fieldset>
          {save.isError && (
            <div role="alert" className="error-banner">
              {save.error.message}
            </div>
          )}
          <div className="editor-footer">
            {task ? (
              <Button
                type="button"
                variant="danger"
                disabled={busy}
                onClick={() => {
                  remove.reset();
                  setConfirmDelete(true);
                }}
              >
                <Trash2 size={15} />
                Delete task
              </Button>
            ) : (
              <span className="save-note">
                <span className="local-dot" />
                Saved for this session
              </span>
            )}
            <div className="editor-actions">
              <Button type="button" variant="outline" disabled={busy} onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={busy || (Boolean(task) && !isDirty)}>
                {save.isPending ? (
                  <LoaderCircle size={15} className="animate-spin" />
                ) : task ? (
                  <Check size={15} />
                ) : (
                  <Plus size={15} />
                )}
                {save.isPending ? 'Saving…' : task ? 'Save changes' : 'Create task'}
              </Button>
            </div>
          </div>
        </form>
        <Dialog
          open={confirmDelete}
          onOpenChange={(open) => {
            if (!remove.isPending) {
              setConfirmDelete(open);
            }
          }}
        >
          <DialogContent
            className="small-dialog"
            onEscapeKeyDown={(event) => {
              if (remove.isPending) {
                event.preventDefault();
              }
            }}
            onPointerDownOutside={(event) => {
              if (remove.isPending) {
                event.preventDefault();
              }
            }}
          >
            <span className="dialog-symbol">
              <Trash2 size={23} />
            </span>
            <DialogTitle>Delete task?</DialogTitle>
            <DialogDescription>
              Delete {task?.id}: {task?.title}? This cannot be undone. Reload samples to
              restore the original sample tasks.
            </DialogDescription>
            {remove.isError && (
              <p className="field-error" role="alert">
                {remove.error.message}
              </p>
            )}
            <div className="confirm-actions">
              <Button
                type="button"
                variant="outline"
                disabled={remove.isPending}
                onClick={() => setConfirmDelete(false)}
                autoFocus
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                disabled={remove.isPending}
                aria-busy={remove.isPending}
                onClick={() => void deleteTask()}
              >
                {remove.isPending && <LoaderCircle size={15} className="animate-spin" />}
                {remove.isPending ? 'Deleting…' : 'Delete task'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
