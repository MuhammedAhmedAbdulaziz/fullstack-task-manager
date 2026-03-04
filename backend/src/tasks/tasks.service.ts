import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Task, TaskStatus, TaskPriority } from './task.entity';
import { CreateTaskDto, UpdateTaskDto, TaskFilterDto } from './task.dto';

@Injectable()
export class TasksService {
  private tasks: Map<string, Task> = new Map();

  constructor() {
    this.seedTasks();
  }

  private seedTasks(): void {
    const sampleTasks: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        title: 'Set up CI/CD pipeline',
        description:
          'Create a GitHub Actions workflow for automated testing and deployment',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        tags: ['devops', 'automation'],
        dueDate: new Date('2026-02-02'),
      },
      {
        title: 'Write unit tests',
        description: 'Achieve 80% code coverage with Jest',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        tags: ['testing', 'quality'],
        dueDate: new Date('2026-02-25'),
      },
      {
        title: 'Dockerize application',
        description: 'Create multi-stage Dockerfile for production builds',
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        tags: ['docker', 'devops'],
        dueDate: new Date('2026-02-20'),
      },
      {
        title: 'Configure monitoring',
        description: 'Set up Prometheus metrics and Grafana dashboards',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        tags: ['monitoring', 'observability'],
        dueDate: null,
      },
      {
        title: 'Security audit',
        description: 'Run vulnerability scans and fix critical issues',
        status: TaskStatus.DONE,
        priority: TaskPriority.HIGH,
        tags: ['security'],
        dueDate: new Date('2026-02-10'),
      },
    ];

    sampleTasks.forEach((taskData) => {
      const task = this.createTaskEntity(taskData);
      this.tasks.set(task.id, task);
    });
  }

  private createTaskEntity(
    data: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Task {
    const now = new Date();
    return {
      id: uuidv4(),
      title: data.title || '',
      description: data.description || '',
      status: data.status || TaskStatus.TODO,
      priority: data.priority || TaskPriority.MEDIUM,
      tags: data.tags || [],
      dueDate: data.dueDate || null,
      createdAt: now,
      updatedAt: now,
    };
  }

  findAll(filter?: TaskFilterDto): Task[] {
    let tasks = Array.from(this.tasks.values());

    if (filter?.status) {
      tasks = tasks.filter((task) => task.status === filter.status);
    }

    if (filter?.priority) {
      tasks = tasks.filter((task) => task.priority === filter.priority);
    }

    if (filter?.search) {
      const searchLower = filter.search.toLowerCase();
      tasks = tasks.filter(
        (task) =>
          task.title.toLowerCase().includes(searchLower) ||
          task.description.toLowerCase().includes(searchLower) ||
          task.tags.some((tag) => tag.toLowerCase().includes(searchLower)),
      );
    }

    return tasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  findOne(id: string): Task {
    const task = this.tasks.get(id);
    if (!task) {
      throw new NotFoundException(`Task with ID "${id}" not found`);
    }
    return task;
  }

  create(createTaskDto: CreateTaskDto): Task {
    const task = this.createTaskEntity({
      ...createTaskDto,
      dueDate: createTaskDto.dueDate ? new Date(createTaskDto.dueDate) : null,
    });
    this.tasks.set(task.id, task);
    return task;
  }

  update(id: string, updateTaskDto: UpdateTaskDto): Task {
    const task = this.findOne(id);

    const updatedTask: Task = {
      ...task,
      ...updateTaskDto,
      dueDate: updateTaskDto.dueDate
        ? new Date(updateTaskDto.dueDate)
        : updateTaskDto.dueDate === null
          ? null
          : task.dueDate,
      updatedAt: new Date(),
    };

    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  remove(id: string): void {
    const task = this.findOne(id);
    this.tasks.delete(task.id);
  }

  getStats(): {
    total: number;
    byStatus: Record<TaskStatus, number>;
    byPriority: Record<TaskPriority, number>;
  } {
    const tasks = Array.from(this.tasks.values());

    const byStatus = {
      [TaskStatus.TODO]: 0,
      [TaskStatus.IN_PROGRESS]: 0,
      [TaskStatus.DONE]: 0,
    };

    const byPriority = {
      [TaskPriority.LOW]: 0,
      [TaskPriority.MEDIUM]: 0,
      [TaskPriority.HIGH]: 0,
    };

    tasks.forEach((task) => {
      byStatus[task.status]++;
      byPriority[task.priority]++;
    });

    return {
      total: tasks.length,
      byStatus,
      byPriority,
    };
  }
}
