import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateApprovalRequestDto {
  type: string; // LEAVE, EXPENSE, ADVANCE, OVERTIME
  title: string;
  amount?: number;
  content?: string;
}

@Injectable()
export class ApprovalsService {
  constructor(private prisma: PrismaService) {}

  // ================= SIDE 1: EMPLOYEE SELF-SERVICE =================

  async createRequest(employeeId: string, dto: CreateApprovalRequestDto) {
    if (!employeeId) {
      throw new BadRequestException('Không tìm thấy thông tin nhân viên.');
    }

    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { department: true, directManager: true },
    });

    if (!employee) {
      throw new NotFoundException('Hồ sơ nhân viên không tồn tại.');
    }

    const amount = Number(dto.amount) || 0;
    const requestNumber = `REQ-${Date.now().toString().slice(-6)}`;

    // Động cơ rẽ nhánh phê duyệt theo hạn mức số tiền:
    // <= 10tr: 1 cấp duyệt (Quản lý trực tiếp)
    // 10tr - 50tr: 2 cấp duyệt (Quản lý trực tiếp + Kế toán trưởng)
    // > 50tr: 3 cấp duyệt (Quản lý trực tiếp + Kế toán trưởng + Ban Giám Đốc)
    let totalSteps = 1;
    if (amount > 50000000) {
      totalSteps = 3;
    } else if (amount > 10000000) {
      totalSteps = 2;
    }

    return this.prisma.$transaction(async (tx) => {
      const request = await tx.approvalRequest.create({
        data: {
          requestNumber,
          requesterId: employeeId,
          type: dto.type,
          title: dto.title,
          amount: dto.amount,
          content: dto.content,
          status: 'PENDING',
          currentApproverId: employee.directManagerId,
        },
      });

      // Tạo các bước duyệt
      const stepsData = [];
      for (let i = 1; i <= totalSteps; i++) {
        stepsData.push({
          requestId: request.id,
          stepOrder: i,
          status: i === 1 ? 'PENDING' : 'WAITING',
          approverId: i === 1 ? employee.directManagerId : undefined,
        });
      }

      await tx.approvalStep.createMany({ data: stepsData });

      return request;
    });
  }

  async getMyRequests(employeeId: string) {
    return this.prisma.approvalRequest.findMany({
      where: { requesterId: employeeId },
      include: { steps: { orderBy: { stepOrder: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ================= SIDE 2: MANAGEMENT & ADMIN =================

  async getPendingRequests() {
    return this.prisma.approvalRequest.findMany({
      where: { status: 'PENDING' },
      include: {
        requester: {
          select: {
            id: true,
            fullName: true,
            employeeCode: true,
            department: { select: { name: true } },
          },
        },
        steps: { orderBy: { stepOrder: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async decideRequest(requestId: string, approverUserId: string, approved: boolean, comment?: string) {
    const request = await this.prisma.approvalRequest.findUnique({
      where: { id: requestId },
      include: { steps: { orderBy: { stepOrder: 'asc' } } },
    });

    if (!request) {
      throw new NotFoundException('Yêu cầu phê duyệt không tồn tại.');
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException('Yêu cầu này đã được xử lý trước đó.');
    }

    const currentStep = request.steps.find((s) => s.status === 'PENDING');
    if (!currentStep) {
      throw new BadRequestException('Không tìm thấy bước duyệt cần xử lý.');
    }

    return this.prisma.$transaction(async (tx) => {
      if (!approved) {
        // Từ chối phê duyệt
        await tx.approvalStep.update({
          where: { id: currentStep.id },
          data: { status: 'REJECTED', comment, updatedAt: new Date() },
        });

        return tx.approvalRequest.update({
          where: { id: requestId },
          data: { status: 'REJECTED' },
        });
      }

      // Phê duyệt bước hiện tại
      await tx.approvalStep.update({
        where: { id: currentStep.id },
        data: { status: 'APPROVED', comment, updatedAt: new Date() },
      });

      // Kiểm tra xem còn bước tiếp theo không
      const nextStep = request.steps.find((s) => s.stepOrder === currentStep.stepOrder + 1);

      if (nextStep) {
        await tx.approvalStep.update({
          where: { id: nextStep.id },
          data: { status: 'PENDING' },
        });
        return tx.approvalRequest.findUnique({ where: { id: requestId }, include: { steps: true } });
      } else {
        // Đã là bước cuối cùng -> Phê duyệt toàn bộ đơn
        return tx.approvalRequest.update({
          where: { id: requestId },
          data: { status: 'APPROVED' },
          include: { steps: true },
        });
      }
    });
  }
}

