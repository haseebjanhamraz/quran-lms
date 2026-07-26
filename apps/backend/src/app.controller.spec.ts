import { Test, TestingModule } from '@nestjs/testing';
import { getNativeConnectionToken } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const mockConnection = {
      readyState: 1,
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: getNativeConnectionToken(),
          useValue: mockConnection,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });

    it('should return health check details', async () => {
      const health = await appController.getHealth();
      expect(health.status).toBe('UP');
      expect(health.database).toBe('CONNECTED');
    });
  });
});
