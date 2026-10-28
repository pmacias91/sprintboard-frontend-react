import * as Popover from '@radix-ui/react-popover';
import {
  ArrowDownUp,
  CalendarDays,
  Link2,
  ListFilter,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { Avatar, PriorityIcon } from '../../components/task-meta';
import { Button } from '../../components/ui/button';
import { Select } from '../../components/ui/select';
import { Tooltip } from '../../components/ui/tooltip';
import {
  CURRENT_USER_ID,
  priorities,
  priorityLabels,
  type Member,
} from '../../types/task';

interface TaskToolbarProps {
  isMine: boolean;
  members: Member[];
  search: string;
  priority: string;
  assignee: string;
  sort: string;
  showLabels: boolean;
  hideCompleted: boolean;
  hasFilters: boolean;
  onSearchChange: (value: string) => void;
  onPriorityChange: (value: string) => void;
  onAssigneeChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onShowLabelsChange: (value: boolean) => void;
  onHideCompletedChange: (value: boolean) => void;
  onClear: () => void;
  onCopyLink: () => void;
}

export function TaskToolbar({
  isMine,
  members,
  search,
  priority,
  assignee,
  sort,
  showLabels,
  hideCompleted,
  hasFilters,
  onSearchChange,
  onPriorityChange,
  onAssigneeChange,
  onSortChange,
  onShowLabelsChange,
  onHideCompletedChange,
  onClear,
  onCopyLink,
}: TaskToolbarProps) {
  return (
    <div className="board-toolbar">
      <div className="toolbar-filters">
        <label className="search-field">
          <Search size={16} />
          <input
            type="search"
            aria-label="Search tasks"
            placeholder="Search tasks…"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
          {search && (
            <button aria-label="Clear search" onClick={() => onSearchChange('')}>
              <X size={13} />
            </button>
          )}
        </label>
        <div className="filter-controls">
          <span className="toolbar-separator" />
          <Select
            label="Filter by priority"
            value={priority}
            onValueChange={onPriorityChange}
            className={`priority-filter ${priority !== 'all' ? 'filter-active' : ''}`}
            options={[
              { value: 'all', label: 'Priority', icon: <ListFilter size={14} /> },
              ...priorities.map((value) => ({
                value,
                label: priorityLabels[value],
                icon: <PriorityIcon priority={value} />,
              })),
            ]}
          />
          <div className="assignee-filter">
            {isMine ? (
              <Tooltip label="My Tasks shows tasks assigned to Alex Morgan">
                <span className="assignee-scope" tabIndex={0}>
                  <Avatar
                    member={members.find((member) => member.id === CURRENT_USER_ID)}
                    small
                  />
                  <span>Assigned to me</span>
                </span>
              </Tooltip>
            ) : (
              <Select
                label="Filter by assignee"
                value={assignee}
                onValueChange={onAssigneeChange}
                className={assignee !== 'all' ? 'filter-active' : ''}
                options={[
                  {
                    value: 'all',
                    label: 'Assignee',
                    icon: <span className="assignee-icon">@</span>,
                  },
                  { value: 'unassigned', label: 'Unassigned' },
                  ...members.map((member) => ({
                    value: member.id,
                    label:
                      member.id === CURRENT_USER_ID
                        ? `${member.name} (you)`
                        : member.name,
                    icon: <Avatar member={member} small />,
                  })),
                ]}
              />
            )}
          </div>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={onClear} className="clear-filters">
              <X size={12} />
              Clear
            </Button>
          )}
        </div>
      </div>
      <div className="toolbar-right">
        <Select
          label="Sort tasks"
          value={sort}
          onValueChange={onSortChange}
          className="sort-select"
          options={[
            { value: 'default', label: 'Default order', icon: <ArrowDownUp size={14} /> },
            {
              value: 'priority',
              label: 'Priority first',
              icon: <ArrowDownUp size={14} />,
            },
            { value: 'due', label: 'Due date', icon: <CalendarDays size={14} /> },
          ]}
        />
        <Popover.Root>
          <Popover.Trigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="display-options-button"
              aria-label="Display options"
            >
              <SlidersHorizontal size={14} />
              <span>Display</span>
            </Button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content className="display-popover" align="end" sideOffset={8}>
              <h3>Display options</h3>
              {!isMine && (
                <label>
                  <input
                    type="checkbox"
                    checked={showLabels}
                    onChange={(event) => onShowLabelsChange(event.target.checked)}
                  />
                  Show card labels
                </label>
              )}
              <label>
                <input
                  type="checkbox"
                  checked={hideCompleted}
                  onChange={(event) => onHideCompletedChange(event.target.checked)}
                />
                Hide completed tasks
              </label>
              <p>Included in copied links.</p>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
        <Tooltip label="Copy view link">
          <Button
            variant="outline"
            size="icon"
            className="copy-view-link"
            aria-label="Copy view link"
            onClick={onCopyLink}
          >
            <Link2 size={15} />
          </Button>
        </Tooltip>
      </div>
    </div>
  );
}
