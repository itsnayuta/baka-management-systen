import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { TasksService, CreateProjectDto, CreateTaskDto } from './tasks.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AudienceGuard } from '../../common/guards/audience.guard';
import { RequireAudience } from '../../common/decorators/audience.decorator';

@ApiTags('Management Portal - Quản lý Dự án & Tiến độ')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AudienceGuard, RolesGuard)
@RequireAudience('management-portal')
@Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.PROJECT_MANAGER)
@Controller('management/operations')
export class ManagementTasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get('projects')
  @ApiOperation({ summary: 'Lấy danh sách toàn bộ dự án kèm ngân sách và chi phí thực tế' })
  async getProjects() {
    return this.tasksService.getProjects();
  }

  @Post('projects')
  @ApiOperation({ summary: 'Tạo dự án mới' })
  async createProject(@Body() dto: CreateProjectDto) {
    return this.tasksService.createProject(dto);
  }

  @Get('tasks')
  @ApiOperation({ summary: 'Lấy toàn bộ công việc cho Kanban & Gantt timeline' })
  @ApiQuery({ name: 'projectId', required: false })
  async getAllTasks(@Query('projectId') projectId?: string) {
    return this.tasksService.getAllTasks(projectId);
  }

  @Post('tasks')
  @ApiOperation({ summary: 'Tạo nhiệm vụ (WBS Task) và phân công nhân sự' })
  async createTask(@Body() dto: CreateTaskDto) {
    return this.tasksService.createTask(dto);
  }

  @Patch('tasks/:id/status')
  @ApiOperation({ summary: 'Cập nhật trạng thái công việc (Quản trị viên)' })
  async updateTaskStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.tasksService.updateTaskStatusForManager(id, status);
  }

  @Get('employees')
  @ApiOperation({ summary: 'Danh sách nhân sự để phân công giao việc' })
  async getEmployees() {
    return this.tasksService.getEmployees();
  }

  @Get('workload-heatmap')
  @ApiOperation({ summary: 'Biểu đồ nhiệt phân bổ tải nhân sự (Workload Heatmap)' })
  async getWorkloadHeatmap() {
    return this.tasksService.getWorkloadHeatmap();
  }
}
