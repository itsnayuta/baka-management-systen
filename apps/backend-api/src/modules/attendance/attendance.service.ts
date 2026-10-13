import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CheckInDto {
  lat?: number;
  lng?: number;
  verificationMethod?: string;
}

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  // ================= SIDE 1: EMPLOYEE SELF-SERVICE =================

  async checkIn(employeeId: string, dto: CheckInDto) {
    if (!employeeId) {
      throw new BadRequestException('Tài khoản chưa được liên kết với hồ sơ nhân viên.');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const now = new Date();
    // Giả định ca sáng bắt đầu 8:30. Quá 8:35 tính là đi muộn
    const standardStart = new Date(today);
    standardStart.setHours(8, 35, 0, 0);
    const isLate = now > standardStart;

    const existingLog = await this.prisma.timeLog.findUnique({
      where: {
        employeeId_workDate: {
          employeeId,
          workDate: today,
        },
      },
    });

    if (existingLog && existingLog.checkIn) {
      throw new BadRequestException('Bạn đã thực hiện Check-in ngày hôm nay rồi.');
    }

    return this.prisma.timeLog.upsert({
      where: {
        employeeId_workDate: {
          employeeId,
          workDate: today,
        },
      },
      update: {
        checkIn: now,
        isLate,
        checkInLat: dto.lat,
        checkInLng: dto.lng,
        verificationMethod: dto.verificationMethod || 'GPS_APP',
      },
      create: {
        employeeId,
        workDate: today,
        checkIn: now,
        isLate,
        checkInLat: dto.lat,
        checkInLng: dto.lng,
        verificationMethod: dto.verificationMethod || 'GPS_APP',
      },
    });
  }

  async checkOut(employeeId: string) {
    if (!employeeId) {
      throw new BadRequestException('Tài khoản chưa được liên kết với hồ sơ nhân viên.');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const now = new Date();

    const log = await this.prisma.timeLog.findUnique({
      where: {
        employeeId_workDate: {
          employeeId,
          workDate: today,
        },
      },
    });

    if (!log || !log.checkIn) {
      throw new BadRequestException('Bạn chưa Check-in ngày hôm nay nên không thể Check-out.');
    }

    // Tính số giờ làm việc thực tế
    const diffMs = now.getTime() - new Date(log.checkIn).getTime();
    const hours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;

    // Giả định giờ về tiêu chuẩn là 17:30. Trước 17:30 tính là về sớm
    const standardEnd = new Date(today);
    standardEnd.setHours(17, 30, 0, 0);
    const isEarlyLeave = now < standardEnd;

    // Nếu làm sau 18:00 tính là Overtime
    const otStart = new Date(today);
    otStart.setHours(18, 0, 0, 0);
    let otHours = 0;
    if (now > otStart) {
      otHours = Math.round(((now.getTime() - otStart.getTime()) / (1000 * 60 * 60)) * 100) / 100;
    }

    return this.prisma.timeLog.update({
      where: { id: log.id },
      data: {
        checkOut: now,
        workingHours: hours,
        overtimeHours: otHours,
        isEarlyLeave,
      },
    });
  }

  async getMyLogs(employeeId: string) {
    if (!employeeId) {
      throw new BadRequestException('Không tìm thấy mã nhân viên.');
    }

    return this.prisma.timeLog.findMany({
      where: { employeeId },
      orderBy: { workDate: 'desc' },
      take: 30,
    });
  }

  // ================= SIDE 2: MANAGEMENT & ADMIN =================

  async getCompanyOverview() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalEmployees = await this.prisma.employee.count({
      where: { status: 'ACTIVE' },
    });

    const todayLogs = await this.prisma.timeLog.findMany({
      where: { workDate: today },
      include: {
        employee: {
          select: { fullName: true, employeeCode: true, department: { select: { name: true } } },
        },
      },
    });

    const checkedInCount = todayLogs.length;
    const lateCount = todayLogs.filter((l) => l.isLate).length;
    const absentCount = Math.max(0, totalEmployees - checkedInCount);

    return {
      date: today.toISOString().split('T')[0],
      totalEmployees,
      checkedInCount,
      lateCount,
      absentCount,
      attendanceRate: totalEmployees > 0 ? Math.round((checkedInCount / totalEmployees) * 100) : 0,
      recentLogs: todayLogs,
    };
  }
}

