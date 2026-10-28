import * as Popover from '@radix-ui/react-popover';
import {
  ArrowUpRight,
  CheckCheck,
  ChevronDown,
  Maximize2,
  Minimize2,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { Avatar } from '../../components/task-meta';
import { Button } from '../../components/ui/button';
import { Tooltip } from '../../components/ui/tooltip';
import type { Member, Task } from '../../types/task';

interface ProjectHeaderProps {
  tasks: Task[];
  members: Member[];
  focusMode: boolean;
  onToggleFocus: () => void;
  onCreate: () => void;
  canCreate: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
  canRefresh: boolean;
}

export function ProjectHeader({
  tasks,
  members,
  focusMode,
  onToggleFocus,
  onCreate,
  canCreate,
  onRefresh,
  isRefreshing,
  canRefresh,
}: ProjectHeaderProps) {
  const completed = tasks.filter((task) => task.status === 'done').length;
  const inProgress = tasks.filter((task) => task.status === 'in-progress').length;
  const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  const visibleMembers = members.slice(0, 4);
  const remainingMembers = members.slice(4);

  return (
    <header className="workspace-project-header">
      <div className="workspace-project-identity">
        <span className="workspace-project-symbol" aria-hidden="true">
          <ArrowUpRight size={23} strokeWidth={1.8} />
        </span>
        <div>
          <div className="workspace-project-title">
            <h1>Platform launch</h1>
            <span className="project-state">
              <span />
              On track
            </span>
          </div>
          <div className="workspace-project-meta">
            <Popover.Root>
              <Popover.Trigger asChild>
                <button className="sprint-summary" aria-label="View sprint progress">
                  <span
                    className="sprint-progress-ring"
                    style={{
                      background: `conic-gradient(#9980ce ${progress}%, #e9e3f1 0)`,
                    }}
                    aria-hidden="true"
                  />
                  <strong>Sprint 08</strong>
                  <span className="sprint-summary-count">
                    {completed}/{tasks.length} done
                  </span>
                  <ChevronDown size={11} />
                </button>
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Content
                  className="sprint-detail"
                  sideOffset={10}
                  align="start"
                  collisionPadding={16}
                  aria-label="Sprint overview"
                >
                  <span className="eyebrow">SPRINT 08</span>
                  <h2>Sprint overview</h2>
                  <p>Oct 19 – Oct 30, 2026</p>
                  <dl className="sprint-detail-stats">
                    <div>
                      <dt>Total tasks</dt>
                      <dd>{tasks.length}</dd>
                    </div>
                    <div>
                      <dt>In progress</dt>
                      <dd>{inProgress}</dd>
                    </div>
                    <div>
                      <dt>Completed</dt>
                      <dd>{completed}</dd>
                    </div>
                  </dl>
                  <div className="sprint-detail-progress">
                    <span>
                      <CheckCheck size={14} />
                      Sprint progress
                    </span>
                    <strong>{progress}%</strong>
                  </div>
                  <div
                    className="progress-track"
                    role="progressbar"
                    aria-label="Sprint completion"
                    aria-valuenow={progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <span style={{ width: `${progress}%` }} />
                  </div>
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
            <span className="workspace-sprint-dates">Oct 19 – 30</span>
          </div>
        </div>
      </div>
      <div className="workspace-project-actions">
        <div className="avatar-stack workspace-team" aria-label="Project team">
          {visibleMembers.map((member) => (
            <Tooltip key={member.id} label={`${member.name} · ${member.role}`}>
              <span tabIndex={0}>
                <Avatar member={member} />
              </span>
            </Tooltip>
          ))}
          {remainingMembers.length > 0 && (
            <Tooltip label={remainingMembers.map((member) => member.name).join(', ')}>
              <span
                className="sample-team-overflow"
                tabIndex={0}
                aria-label={`${remainingMembers.length} more team members: ${remainingMembers.map((member) => member.name).join(', ')}`}
              >
                +{remainingMembers.length}
              </span>
            </Tooltip>
          )}
        </div>
        <Tooltip label={isRefreshing ? 'Refreshing tasks' : 'Refresh tasks'}>
          <Button
            variant="outline"
            size="icon"
            className="sample-refresh-button"
            aria-label="Refresh tasks"
            aria-busy={isRefreshing}
            onClick={onRefresh}
            disabled={!canRefresh || isRefreshing}
          >
            <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : undefined} />
          </Button>
        </Tooltip>
        <Tooltip label={focusMode ? 'Exit focus mode' : 'Enter focus mode'}>
          <Button
            variant="outline"
            size="icon"
            className="workspace-focus-button"
            aria-label={focusMode ? 'Exit focus mode' : 'Enter focus mode'}
            aria-pressed={focusMode}
            onClick={onToggleFocus}
          >
            {focusMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </Button>
        </Tooltip>
        <Button
          className="sample-create-button"
          aria-label="New task"
          onClick={onCreate}
          disabled={!canCreate}
        >
          <Plus size={16} />
          <span className="sample-create-desktop">New task</span>
          <span className="sample-create-mobile">New</span>
        </Button>
      </div>
    </header>
  );
}
