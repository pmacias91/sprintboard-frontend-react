import {
  AlertCircle,
  Check,
  Circle,
  SignalHigh,
  SignalLow,
  SignalMedium,
} from 'lucide-react';
import type { Member, Priority, Status } from '../types/task';
import { priorityLabels, statusLabels } from '../types/task';
import { cn } from '../lib/utils';

export function Avatar({
  member,
  small = false,
  className,
}: {
  member?: Member;
  small?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'avatar',
        member ? `avatar-${member.color}` : 'avatar-unassigned',
        small && 'avatar-small',
        className,
      )}
      aria-label={member?.name || 'Unassigned'}
      title={member?.name || 'Unassigned'}
    >
      {member?.initials || '—'}
    </span>
  );
}

export function PriorityIcon({ priority }: { priority: Priority }) {
  const Icon = {
    urgent: AlertCircle,
    high: SignalHigh,
    medium: SignalMedium,
    low: SignalLow,
  }[priority];
  return <Icon size={14} strokeWidth={2} aria-hidden="true" />;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={`priority-badge priority-${priority}`}>
      <PriorityIcon priority={priority} />
      {priorityLabels[priority]}
    </span>
  );
}

export function StatusIcon({ status }: { status: Status }) {
  if (status === 'done') {
    return (
      <span className="status-icon status-done">
        <Check size={11} strokeWidth={3} />
      </span>
    );
  }
  if (status === 'in-progress') {
    return <span className="status-icon status-progress" />;
  }
  return <Circle size={15} className="status-todo" />;
}

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`status-badge status-badge-${status}`}>
      <StatusIcon status={status} />
      {statusLabels[status]}
    </span>
  );
}

export function LabelBadge({ label }: { label: string }) {
  return (
    <span className={`label-badge label-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      {label}
    </span>
  );
}
