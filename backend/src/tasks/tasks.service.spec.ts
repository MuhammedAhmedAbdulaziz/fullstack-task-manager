import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TaskStatus, TaskPriority } from './task.entity';
import { CreateTaskDto } from './task.dto';

describe('TasksService', () => {
  let service: TasksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TasksService],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of tasks', () => {
      const tasks = service.findAll();
      expect(Array.isArray(tasks)).toBe(true);
      expect(tasks.length).toBeGreaterThan(0);
    });

    it('should filter tasks by status', () => {
      const tasks = service.findAll({ status: TaskStatus.TODO });
      tasks.forEach((task) => {
        expect(task.status).toBe(TaskStatus.TODO);
      });
    });

    it('should filter tasks by priority', () => {
      const tasks = service.findAll({ priority: TaskPriority.HIGH });
      tasks.forEach((task) => {
        expect(task.priority).toBe(TaskPriority.HIGH);
      });
    });

    it('should filter tasks by search term', () => {
      const tasks = service.findAll({ search: 'docker' });
      expect(tasks.length).toBeGreaterThan(0);
      tasks.forEach((task) => {
        const matchesSearch =
          task.title.toLowerCase().includes('docker') ||
          task.description.toLowerCase().includes('docker') ||
          task.tags.some((tag) => tag.toLowerCase().includes('docker'));
        expect(matchesSearch).toBe(true);
      });
    });
  });

  describe('findOne', () => {
    it('should return a task by id', () => {
      const allTasks = service.findAll();
      const firstTask = allTasks[0];
      const foundTask = service.findOne(firstTask.id);
      expect(foundTask).toEqual(firstTask);
    });

    it('should throw NotFoundException for invalid id', () => {
      expect(() => service.findOne('invalid-id')).toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new task', () => {
      const createTaskDto: CreateTaskDto = {
        title: 'New Test Task',
        description: 'Test description',
        priority: TaskPriority.HIGH,
        tags: ['test'],
      };

      const task = service.create(createTaskDto);

      expect(task.id).toBeDefined();
      expect(task.title).toBe(createTaskDto.title);
      expect(task.description).toBe(createTaskDto.description);
      expect(task.priority).toBe(createTaskDto.priority);
      expect(task.status).toBe(TaskStatus.TODO);
      expect(task.tags).toEqual(createTaskDto.tags);
      expect(task.createdAt).toBeDefined();
      expect(task.updatedAt).toBeDefined();
    });

    it('should set default values for optional fields', () => {
      const createTaskDto: CreateTaskDto = {
        title: 'Minimal Task',
      };

      const task = service.create(createTaskDto);

      expect(task.status).toBe(TaskStatus.TODO);
      expect(task.priority).toBe(TaskPriority.MEDIUM);
      expect(task.description).toBe('');
      expect(task.tags).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update a task', () => {
      const allTasks = service.findAll();
      const taskToUpdate = allTasks[0];

      const updatedTask = service.update(taskToUpdate.id, {
        title: 'Updated Title',
        status: TaskStatus.DONE,
      });

      expect(updatedTask.title).toBe('Updated Title');
      expect(updatedTask.status).toBe(TaskStatus.DONE);
      expect(updatedTask.id).toBe(taskToUpdate.id);
    });

    it('should throw NotFoundException when updating non-existent task', () => {
      expect(() =>
        service.update('invalid-id', { title: 'Updated' }),
      ).toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a task', () => {
      const createTaskDto: CreateTaskDto = {
        title: 'Task to delete',
      };
      const task = service.create(createTaskDto);

      service.remove(task.id);

      expect(() => service.findOne(task.id)).toThrow(NotFoundException);
    });

    it('should throw NotFoundException when deleting non-existent task', () => {
      expect(() => service.remove('invalid-id')).toThrow(NotFoundException);
    });
  });

  describe('getStats', () => {
    it('should return task statistics', () => {
      const stats = service.getStats();

      expect(stats.total).toBeGreaterThan(0);
      expect(stats.byStatus).toBeDefined();
      expect(stats.byPriority).toBeDefined();
      expect(typeof stats.byStatus[TaskStatus.TODO]).toBe('number');
      expect(typeof stats.byPriority[TaskPriority.HIGH]).toBe('number');
    });
  });
});
