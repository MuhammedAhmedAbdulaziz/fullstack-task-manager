import { TaskStatus, TaskPriority } from './api';

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function getStatusColor(status: TaskStatus): string {
  switch (status) {
    case TaskStatus.TODO:
      return 'bg-slate-100 text-slate-700 border-slate-200';
    case TaskStatus.IN_PROGRESS:
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case TaskStatus.DONE:
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

export function getPriorityColor(priority: TaskPriority): string {
  switch (priority) {
    case TaskPriority.LOW:
      return 'bg-gray-100 text-gray-600';
    case TaskPriority.MEDIUM:
      return 'bg-amber-100 text-amber-700';
    case TaskPriority.HIGH:
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

export function formatDate(dateString: string | null): string {
  if (!dateString) return 'No due date';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getStatusLabel(status: TaskStatus): string {
  switch (status) {
    case TaskStatus.TODO:
      return 'To Do';
    case TaskStatus.IN_PROGRESS:
      return 'In Progress';
    case TaskStatus.DONE:
      return 'Done';
    default:
      return status;
  }
}
