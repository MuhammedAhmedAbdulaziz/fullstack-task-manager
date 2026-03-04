'use client';

import { TaskStats, TaskStatus, TaskPriority } from '@/lib/api';
import { getStatusLabel } from '@/lib/utils';
import { CheckCircle2, Clock, ListTodo, AlertTriangle } from 'lucide-react';

interface StatsCardProps {
  stats: TaskStats | null;
  isLoading: boolean;
}

export function StatsCard({ stats, isLoading }: StatsCardProps) {
  if (isLoading) {
    return (
      <div className="card p-6 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-32 mb-4"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const statItems = [
    {
      label: 'Total Tasks',
      value: stats.total,
      icon: ListTodo,
      color: 'text-slate-600 bg-slate-100',
    },
    {
      label: getStatusLabel(TaskStatus.TODO),
      value: stats.byStatus[TaskStatus.TODO],
      icon: Clock,
      color: 'text-slate-600 bg-slate-100',
    },
    {
      label: getStatusLabel(TaskStatus.IN_PROGRESS),
      value: stats.byStatus[TaskStatus.IN_PROGRESS],
      icon: Clock,
      color: 'text-blue-600 bg-blue-100',
    },
    {
      label: getStatusLabel(TaskStatus.DONE),
      value: stats.byStatus[TaskStatus.DONE],
      icon: CheckCircle2,
      color: 'text-emerald-600 bg-emerald-100',
    },
  ];

  return (
    <div className="card p-6" data-testid="stats-card">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Overview</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statItems.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-3 p-3 rounded-lg bg-slate-50"
          >
            <div className={`p-2 rounded-lg ${item.color}`}>
              <item.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-slate-900">
                {item.value}
              </p>
              <p className="text-xs text-slate-500">{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      {stats.byPriority[TaskPriority.HIGH] > 0 && (
        <div className="mt-4 flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <p className="text-sm text-amber-700">
            <strong>{stats.byPriority[TaskPriority.HIGH]}</strong> high priority{' '}
            {stats.byPriority[TaskPriority.HIGH] === 1 ? 'task' : 'tasks'} need
            attention
          </p>
        </div>
      )}
    </div>
  );
}
