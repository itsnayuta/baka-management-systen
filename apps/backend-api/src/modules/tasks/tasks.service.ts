import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateProjectDto {
  projectCode: string;
  name: string;
  description?: string;
  managerId?: string;
  estimatedBudget: number;
  startDate?: string;
  deadline?: string;
}

export interface CreateTaskDto {
  projectId: string;
  title: string;
  description?: string;
  priority?: string;
  estimatedHours: number;
  dueDate?: string;
  assigneeIds?: string[];
}

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  // ================= SIDE 1: EMPLOYEE SELF-SERVICE =================

  async getMyTasks(employeeId: string) {
    if (!employeeId) {
      throw new BadRequestException('Không tìm thấy thông tin nhân viên.');
    }

    const assignments = await this.prisma.taskAssignee.findMany({
      where: { employeeId },
      include: {
        task: {
          include: {
            project: { select: { id: true, name: true, projectCode: true } },
            workLogs: {
              where: { employeeId },
              orderBy: { logDate: 'desc' },
            },
          },
        },
      },
    });

    return assignments.map((a) => a.task);
  }

  async updateTaskStatus(employeeId: string, taskId: string, status: string) {
    const isAssigned = await this.prisma.taskAssignee.findUnique({
      where: {
        taskId_employeeId: {
          taskId,
          employeeId,
        },
      },
    });

    if (!isAssigned) {
      throw new ForbiddenException('Bạn không được phân công vào nhiệm vụ này.');
    }

    return this.prisma.task.update({
      where: { id: taskId },
      data: { status },
    });
  }

  async logWork(employeeId: string, taskId: string, hours: number, description?: string) {
    if (hours <= 0) {
      throw new BadRequestException('Số giờ làm việc phải lớn hơn 0.');
    }

    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new NotFoundException('Không tìm thấy hồ sơ nhân viên.');
    }

    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true },
    });

    if (!task) {
      throw new NotFoundException('Không tìm thấy công việc.');
    }

    const hourlyRate = Number(employee.hourlyCostRate) || 0;
    const additionalLaborCost = hours * hourlyRate;

    // Transaction: Tạo worklog, tăng actualHours của task, và cập nhật actualCost của dự án
    return this.prisma.$transaction(async (tx) => {
      const workLog = await tx.workLog.create({
        data: {
          taskId,
          employeeId,
          hoursSpent: hours,
          hourlyCostRate: hourlyRate,
          description,
        },
      });

      await tx.task.update({
        where: { id: taskId },
        data: {
          actualHours: { increment: hours },
        },
      });

      await tx.project.update({
        where: { id: task.projectId },
        data: {
          actualCost: { increment: additionalLaborCost },
        },
      });

      return workLog;
    });
  }

  // ================= SIDE 2: MANAGEMENT & ADMIN =================

  async getProjects() {
    return this.prisma.project.findMany({
      include: {
        manager: { select: { fullName: true, employeeCode: true } },
        _count: { select: { tasks: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createProject(dto: CreateProjectDto) {
    return this.prisma.project.create({
      data: {
        projectCode: dto.projectCode,
        name: dto.name,
        description: dto.description,
        managerId: dto.managerId,
        estimatedBudget: dto.estimatedBudget,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        deadline: dto.deadline ? new Date(dto.deadline) : undefined,
      },
    });
  }

  async createTask(dto: CreateTaskDto) {
    return this.prisma.$transaction(async (tx) => {
      const task = await tx.task.create({
        data: {
          projectId: dto.projectId,
          title: dto.title,
          description: dto.description,
          priority: dto.priority || 'MEDIUM',
          estimatedHours: dto.estimatedHours,
          dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        },
      });

      if (dto.assigneeIds && dto.assigneeIds.length > 0) {
        await tx.taskAssignee.createMany({
          data: dto.assigneeIds.map((empId) => ({
            taskId: task.id,
            employeeId: empId,
          })),
        });
      }

      return task;
    });
  }

  async getWorkloadHeatmap() {
    // ponytail: In-memory O(N) aggregation is optimal for < 10k logs/month; when logs exceed 100k, upgrade to PostgreSQL GROUP BY (prisma.$queryRaw)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const workLogs = await this.prisma.workLog.findMany({
      where: { logDate: { gte: thirtyDaysAgo } },
      include: {
        employee: {
          select: { id: true, fullName: true, employeeCode: true, department: { select: { name: true } } },
        },
      },
    });

    const heatmapMap = new Map<string, { employee: any; totalHours: number; totalCost: number }>();

    for (const log of workLogs) {
      const empId = log.employeeId;
      const hours = Number(log.hoursSpent);
      const cost = hours * Number(log.hourlyCostRate);

      if (!heatmapMap.has(empId)) {
        heatmapMap.set(empId, {
          employee: log.employee,
          totalHours: hours,
          totalCost: cost,
        });
      } else {
        const item = heatmapMap.get(empId)!;
        item.totalHours += hours;
        item.totalCost += cost;
      }
    }

    return Array.from(heatmapMap.values()).map((v) => ({
      ...v,
      totalHours: Math.round(v.totalHours * 100) / 100,
      totalCost: Math.round(v.totalCost),
      status: v.totalHours > 180 ? 'OVERLOAD' : v.totalHours < 80 ? 'UNDERLOAD' : 'OPTIMAL',
    }));
  }
}

