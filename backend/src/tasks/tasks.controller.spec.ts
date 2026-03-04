import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TaskStatus, TaskPriority } from './task.entity';

describe('TasksController', () => {
  let controller: TasksController;
  let service: TasksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [TasksService],
    }).compile();

    controller = module.get<TasksController>(TasksController);
    service = module.get<TasksService>(TasksService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of tasks', () => {
      const result = controller.findAll({});
      expect(Array.isArray(result)).toBe(true);
    });

    it('should pass filters to service', () => {
      const spy = jest.spyOn(service, 'findAll');
      const filter = { status: TaskStatus.TODO };
      
      controller.findAll(filter);
      
      expect(spy).toHaveBeenCalledWith(filter);
    });
  });

  describe('findOne', () => {
    it('should return a task', () => {
      const tasks = controller.findAll({});
      const firstTask = tasks[0];
      
      const result = controller.findOne(firstTask.id);
      
      expect(result).toEqual(firstTask);
    });
  });

  describe('create', () => {
    it('should create and return a task', () => {
      const createDto = {
        title: 'Controller Test Task',
        description: 'Test',
        priority: TaskPriority.HIGH,
      };
      
      const result = controller.create(createDto);
      
      expect(result.title).toBe(createDto.title);
      expect(result.id).toBeDefined();
    });
  });

  describe('update', () => {
    it('should update and return a task', () => {
      const tasks = controller.findAll({});
      const taskToUpdate = tasks[0];
      
      const result = controller.update(taskToUpdate.id, {
        title: 'Updated via Controller',
      });
      
      expect(result.title).toBe('Updated via Controller');
    });
  });

  describe('remove', () => {
    it('should delete a task', () => {
      const newTask = controller.create({ title: 'To Delete' });
      
      expect(() => controller.remove(newTask.id)).not.toThrow();
    });
  });

  describe('getStats', () => {
    it('should return statistics', () => {
      const result = controller.getStats();
      
      expect(result.total).toBeDefined();
      expect(result.byStatus).toBeDefined();
      expect(result.byPriority).toBeDefined();
    });
  });
});
