'use client';

import { TaskStatus, TaskPriority, TaskFilter } from '@/lib/api';
import { getStatusLabel } from '@/lib/utils';
import { Search, X } from 'lucide-react';

interface TaskFiltersProps {
  filter: TaskFilter;
  onFilterChange: (filter: TaskFilter) => void;
}

export function TaskFilters({ filter, onFilterChange }: TaskFiltersProps) {
  const hasActiveFilters = filter.status || filter.priority || filter.search;

  const clearFilters = () => {
    onFilterChange({});
  };

  return (
    <div
      className='flex flex-wrap items-center gap-3'
      data-testid='task-filters'
    >
      <div className='relative flex-1 min-w-[200px] max-w-md'>
        <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400' />
        <input
          type='text'
          placeholder='Search tasks...'
          className='input pl-9'
          value={filter.search || ''}
          onChange={(e) =>
            onFilterChange({ ...filter, search: e.target.value || undefined })
          }
          data-testid='search-input'
        />
      </div>

      <select
        className='input w-auto bg-slate-50 text-slate-600'
        value={filter.status || ''}
        onChange={(e) =>
          onFilterChange({
            ...filter,
            status: (e.target.value as TaskStatus) || undefined,
          })
        }
        data-testid='status-filter'
      >
        <option value=''>All Status</option>
        {Object.values(TaskStatus).map((status) => (
          <option key={status} value={status}>
            {getStatusLabel(status)}
          </option>
        ))}
      </select>

      <select
        className='input w-auto bg-slate-50 text-slate-600'
        value={filter.priority || ''}
        onChange={(e) =>
          onFilterChange({
            ...filter,
            priority: (e.target.value as TaskPriority) || undefined,
          })
        }
        data-testid='priority-filter'
      >
        <option value=''>All Priority</option>
        {Object.values(TaskPriority).map((priority) => (
          <option key={priority} value={priority}>
            {priority}
          </option>
        ))}
      </select>

      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className='inline-flex items-center gap-1 px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors'
        >
          <X className='w-4 h-4' />
          Clear
        </button>
      )}
    </div>
  );
}
