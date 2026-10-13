import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ApprovalsService } from './approvals.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('ApprovalsService (Kiểm thử Ma trận Phê duyệt Đa cấp & State Machine)', () => {
  let service: ApprovalsService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      employee: {
        findUnique: vi.fn(),
      },
      approvalRequest: {
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      approvalStep: {
        createMany: vi.fn(),
        update: vi.fn(),
      },
      $transaction: vi.fn((callback) => callback(prismaMock)),
    };
    service = new ApprovalsService(prismaMock as unknown as PrismaService);
  });

  describe('createRequest (Ma trận phân bổ số cấp duyệt theo hạn mức)', () => {
    beforeEach(() => {
      prismaMock.employee.findUnique.mockResolvedValue({
        id: 'emp-1',
        fullName: 'Nhân viên A',
        directManagerId: 'mgr-1',
      });
      prismaMock.approvalRequest.create.mockImplementation((args: any) =>
        Promise.resolve({ id: 'req-1', ...args.data }),
      );
    });

    it('Đề xuất chi <= 10 triệu VNĐ chỉ cần 1 cấp duyệt (Quản lý trực tiếp)', async () => {
      await service.createRequest('emp-1', {
        type: 'EXPENSE',
        title: 'Mua văn phòng phẩm',
        amount: 5000000,
      });

      expect(prismaMock.approvalStep.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ stepOrder: 1, status: 'PENDING' }),
        ]),
      });
      const createdSteps = prismaMock.approvalStep.createMany.mock.calls[0][0].data;
      expect(createdSteps.length).toBe(1);
    });

    it('Đề xuất chi từ 10 - 50 triệu VNĐ cần 2 cấp duyệt (Quản lý + Kế toán)', async () => {
      await service.createRequest('emp-1', {
        type: 'EXPENSE',
        title: 'Mua máy tính làm việc',
        amount: 25000000,
      });

      const createdSteps = prismaMock.approvalStep.createMany.mock.calls[0][0].data;
      expect(createdSteps.length).toBe(2);
      expect(createdSteps[0].status).toBe('PENDING');
      expect(createdSteps[1].status).toBe('WAITING');
    });

    it('Đề xuất chi > 50 triệu VNĐ bắt buộc 3 cấp duyệt (Quản lý + Kế toán + Ban Giám Đốc)', async () => {
      await service.createRequest('emp-1', {
        type: 'EXPENSE',
        title: 'Thuê văn phòng mới',
        amount: 120000000,
      });

      const createdSteps = prismaMock.approvalStep.createMany.mock.calls[0][0].data;
      expect(createdSteps.length).toBe(3);
    });
  });

  describe('decideRequest (Xử lý chuyển trạng thái đơn)', () => {
    it('khi người duyệt từ chối (REJECT), toàn bộ đơn lập tức chuyển thành REJECTED', async () => {
      prismaMock.approvalRequest.findUnique.mockResolvedValue({
        id: 'req-1',
        status: 'PENDING',
        steps: [{ id: 'step-1', stepOrder: 1, status: 'PENDING' }],
      });

      await service.decideRequest('req-1', 'approver-1', false, 'Chi phí không hợp lệ');

      expect(prismaMock.approvalStep.update).toHaveBeenCalledWith({
        where: { id: 'step-1' },
        data: expect.objectContaining({ status: 'REJECTED', comment: 'Chi phí không hợp lệ' }),
      });
      expect(prismaMock.approvalRequest.update).toHaveBeenCalledWith({
        where: { id: 'req-1' },
        data: { status: 'REJECTED' },
      });
    });
  });
});

