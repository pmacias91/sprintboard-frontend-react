import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, isBefore, parseISO, startOfDay } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function formatDate(value: string) {
  return value ? format(parseISO(value), 'MMM d') : 'No due date';
}
export function isOverdue(value: string) {
  return Boolean(value) && isBefore(parseISO(value), startOfDay(new Date()));
}
