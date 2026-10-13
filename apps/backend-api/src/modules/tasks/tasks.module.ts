import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { SelfTasksController } from './self-tasks.controller';
import { ManagementTasksController } from './management-tasks.controller';

@Module({
  controllers: [SelfTasksController, ManagementTasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}

