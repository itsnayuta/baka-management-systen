import { Controller, Get, Patch, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Employee Portal - Công việc (Self-Service)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('self/tasks')
export class SelfTasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách các công việc được phân công cho chính mình' })
  async getMyTasks(@CurrentUser() user: AuthenticatedUser) {
    return this.tasksService.getMyTasks(user.employeeId!);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Cập nhật trạng thái công việc (TODO, IN_PROGRESS, REVIEW, DONE)' })
  async updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') taskId: string,
    @Body('status') status: string,
  ) {
    return this.tasksService.updateTaskStatus(user.employeeId!, taskId, status);
  }

  @Post(':id/work-log')
  @ApiOperation({ summary: 'Log giờ làm việc vào task (Tự động tính chi phí giá vốn dự án)' })
  async logWork(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') taskId: string,
    @Body() body: { hours: number; description?: string },
  ) {
    return this.tasksService.logWork(user.employeeId!, taskId, body.hours, body.description);
  }
}

