import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AudienceGuard } from './audience.guard';
import { AUDIENCE_KEY } from '../decorators/audience.decorator';

describe('AudienceGuard (Kiểm thử Phân tách 2 Side: Employee vs Management Portal)', () => {
  let guard: AudienceGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new AudienceGuard(reflector);
  });

  const createMockContext = (user: any): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  };

  it('nên cho phép truy cập nếu endpoint không yêu cầu Audience cụ thể', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = createMockContext({ audience: 'employee-portal' });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('nên CHẶN và ném ForbiddenException nếu Token thiếu thông tin audience', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue('management-portal');
    const context = createMockContext({ userId: '123' }); // không có audience

    expect(() => guard.canActivate(context)).toThrowError(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrowError(/Phiên đăng nhập không hợp lệ/);
  });

  it('nên CHẶN NGAY LẬP TỨC nếu Token là employee-portal nhưng cố gọi API của management-portal', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue('management-portal');
    const context = createMockContext({ audience: 'employee-portal' });

    expect(() => guard.canActivate(context)).toThrowError(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrowError(
      /Token cổng 'employee-portal' không được phép thao tác tại cổng 'management-portal'/,
    );
  });

  it('nên CHO PHÉP truy cập nếu Token management-portal gọi đúng API của management-portal', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue('management-portal');
    const context = createMockContext({ audience: 'management-portal' });

    expect(guard.canActivate(context)).toBe(true);
  });
});
