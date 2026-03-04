'use client';

import { Task, TaskStatus, api } from '@/lib/api';
import {
  cn,
  getStatusColor,
  getPriorityColor,
  formatDate,
  getStatusLabel,
} from '@/lib/utils';
import { Calendar, Tag, Trash2, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface TaskCardProps {
  task: Task;
  onUpdate: () => void;
  onDelete: () => void;
}

export function TaskCard({ task, onUpdate, onDelete }: TaskCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const handleStatusChange = async (newStatus: TaskStatus) => {
    setIsUpdating(true);
    setShowStatusMenu(false);
    try {
      await api.updateTask(task.id, { status: newStatus });
      onUpdate();
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    setIsUpdating(true);
    try {
      await api.deleteTask(task.id);
      onDelete();
    } catch (error) {
      console.error('Failed to delete task:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div
      className={cn(
        'card p-4 transition-all hover:shadow-md',
        isUpdating && 'opacity-50 pointer-events-none',
      )}
      data-testid='task-card'
    >
      <div className='flex items-start justify-between gap-4'>
        <div className='flex-1 min-w-0'>
          <h3
            className='font-medium text-slate-900 truncate'
            data-testid='task-title'
          >
            {task.title}
          </h3>
          {task.description && (
            <p className='mt-1 text-sm text-slate-500 line-clamp-2'>
              {task.description}
            </p>
          )}
        </div>
        <button
          onClick={handleDelete}
          className='p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors'
          aria-label='Delete task'
          data-testid='delete-task-btn'
        >
          <Trash2 className='w-4 h-4' />
        </button>
      </div>

      <div className='mt-3 flex flex-wrap items-center gap-2'>
        <div className='relative'>
          <button
            onClick={() => setShowStatusMenu(!showStatusMenu)}
            className={cn(
              'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
              getStatusColor(task.status),
            )}
            data-testid='status-badge'
          >
            {getStatusLabel(task.status)}
            <ChevronDown className='w-3 h-3' />
          </button>

          {showStatusMenu && (
            <div className='absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10 min-w-[140px]'>
              {Object.values(TaskStatus).map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  className={cn(
                    'w-full px-3 py-1.5 text-left text-sm hover:bg-slate-50 transition-colors',
                    task.status === status && 'bg-slate-50 font-medium',
                  )}
                >
                  {getStatusLabel(status)}
                </button>
              ))}
            </div>
          )}
        </div>

        <span
          className={cn(
            'px-2.5 py-1 rounded-full text-xs font-medium',
            getPriorityColor(task.priority),
          )}
          data-testid='priority-badge'
        >
          {task.priority}
        </span>
      </div>

      <div className='mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500'>
        {task.dueDate && (
          <span className='inline-flex items-center gap-1'>
            <Calendar className='w-3.5 h-3.5' />
            {formatDate(task.dueDate)}
          </span>
        )}

        {task.tags.length > 0 && (
          <span className='inline-flex items-center gap-1'>
            <Tag className='w-3.5 h-3.5' />
            {task.tags.join(', ')}
          </span>
        )}
      </div>
    </div>
  );
}
