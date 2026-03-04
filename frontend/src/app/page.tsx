'use client';

import { useState, useEffect, useCallback } from 'react';
import { Task, TaskStats, TaskFilter, api } from '@/lib/api';
import { TaskCard, TaskForm, TaskFilters, StatsCard } from '@/components';
import { Plus, RefreshCw, AlertCircle } from 'lucide-react';

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [filter, setFilter] = useState<TaskFilter>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getTasks(filter);
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  const fetchStats = useCallback(async () => {
    setIsStatsLoading(true);
    try {
      const data = await api.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setIsStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleTaskCreated = () => {
    setShowForm(false);
    fetchTasks();
    fetchStats();
  };

  const handleTaskUpdated = () => {
    fetchTasks();
    fetchStats();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <StatsCard stats={stats} isLoading={isStatsLoading} />

      <div className="mt-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-lg font-semibold text-slate-900">Tasks</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                fetchTasks();
                fetchStats();
              }}
              className="btn btn-secondary"
              disabled={isLoading}
              data-testid="refresh-btn"
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
              />
              Refresh
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="btn btn-primary"
              data-testid="add-task-btn"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </button>
          </div>
        </div>

        {showForm && (
          <div className="mb-6">
            <TaskForm
              onSuccess={handleTaskCreated}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        <div className="mb-6">
          <TaskFilters filter={filter} onFilterChange={setFilter} />
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">
                Error loading tasks
              </p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
            <button
              onClick={fetchTasks}
              className="ml-auto btn btn-secondary text-sm"
            >
              Retry
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="h-5 bg-slate-200 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-slate-100 rounded w-full mb-2"></div>
                <div className="h-4 bg-slate-100 rounded w-2/3"></div>
                <div className="flex gap-2 mt-4">
                  <div className="h-6 w-20 bg-slate-200 rounded-full"></div>
                  <div className="h-6 w-16 bg-slate-200 rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-1">
              No tasks found
            </h3>
            <p className="text-slate-500 mb-4">
              {filter.status || filter.priority || filter.search
                ? 'Try adjusting your filters'
                : 'Get started by creating your first task'}
            </p>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="btn btn-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Task
              </button>
            )}
          </div>
        ) : (
          <div
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
            data-testid="task-list"
          >
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onUpdate={handleTaskUpdated}
                onDelete={handleTaskUpdated}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
