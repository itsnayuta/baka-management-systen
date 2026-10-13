import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { RolesGuard } from './roles.guard';

describe('RolesGuard (Kiểm thử Phân quyền Vai trò RBAC)', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
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

  it('nên cho phép truy cập nếu endpoint không yêu cầu vai trò Role nào', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = createMockContext({ role: Role.EMPLOYEE });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('SUPER_ADMIN luôn luôn có quyền truy cập vào mọi endpoint', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.DIRECTOR, Role.FINANCE_MANAGER]);
    const context = createMockContext({ role: Role.SUPER_ADMIN });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('nên CHẶN và ném ForbiddenException nếu EMPLOYEE cố gọi endpoint dành cho DIRECTOR / FINANCE_MANAGER', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.DIRECTOR, Role.FINANCE_MANAGER]);
    const context = createMockContext({ role: Role.EMPLOYEE });

    expect(() => guard.canActivate(context)).toThrowError(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrowError(/Từ chối truy cập: Tài khoản cần một trong các quyền/);
  });

  it('nên CHO PHÉP nếu vai trò của người dùng nằm trong danh sách quyền yêu cầu', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.DIRECTOR, Role.FINANCE_MANAGER]);
    const context = createMockContext({ role: Role.FINANCE_MANAGER });

    expect(guard.canActivate(context)).toBe(true);
  });
});

