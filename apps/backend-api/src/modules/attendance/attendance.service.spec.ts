import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('AttendanceService (Kiểm thử Chấm công GPS & Phát hiện Đi muộn)', () => {
  let service: AttendanceService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      timeLog: {
        findUnique: vi.fn(),
        upsert: vi.fn((params) => Promise.resolve(params.create || params.update)),
        update: vi.fn((params) => Promise.resolve(params.data)),
      },
      employee: {
        count: vi.fn(),
      },
    };
    service = new AttendanceService(prismaMock as unknown as PrismaService);
  });

  it('nên ném BadRequestException nếu nhân viên đã check-in ngày hôm nay rồi', async () => {
    prismaMock.timeLog.findUnique.mockResolvedValue({
      id: 'log-1',
      checkIn: new Date(),
    });

    await expect(
      service.checkIn('emp-1', { lat: 21.0285, lng: 105.8542 }),
    ).rejects.toThrowError(BadRequestException);
    await expect(
      service.checkIn('emp-1', { lat: 21.0285, lng: 105.8542 }),
    ).rejects.toThrowError(/Bạn đã thực hiện Check-in ngày hôm nay rồi/);
  });

  it('nên cho phép check-in lần đầu và lưu tọa độ GPS cùng phương thức xác thực', async () => {
    prismaMock.timeLog.findUnique.mockResolvedValue(null);

    await service.checkIn('emp-1', {
      lat: 21.0285,
      lng: 105.8542,
      verificationMethod: 'GPS_APP',
    });

    expect(prismaMock.timeLog.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          employeeId: 'emp-1',
          checkInLat: 21.0285,
          checkInLng: 105.8542,
          verificationMethod: 'GPS_APP',
        }),
      }),
    );
  });
});
