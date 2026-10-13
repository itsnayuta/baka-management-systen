import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const { email, password, portal } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        employee: {
          include: { department: true },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Tài khoản đã bị tạm khóa.');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác.');
    }

    // Business check: Quản lý đăng nhập vào Management Portal, Nhân viên vào Employee Portal
    const managementRoles: Role[] = [
      Role.SUPER_ADMIN,
      Role.DIRECTOR,
      Role.HR_MANAGER,
      Role.FINANCE_MANAGER,
      Role.PROJECT_MANAGER,
    ];

    if (portal === 'management-portal' && !managementRoles.includes(user.role)) {
      throw new ForbiddenException(
        'Tài khoản của bạn là Nhân viên thực thi, không có quyền truy cập Cổng Quản trị. Vui lòng đăng nhập tại Cổng Nhân viên.',
      );
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      employeeId: user.employeeId || user.employee?.id,
      aud: portal,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      portal,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        employee: user.employee
          ? {
              id: user.employee.id,
              employeeCode: user.employee.employeeCode,
              fullName: user.employee.fullName,
              department: user.employee.department?.name,
              hourlyCostRate: user.role === Role.EMPLOYEE ? undefined : user.employee.hourlyCostRate,
            }
          : null,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        employee: {
          include: { department: true },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại.');
    }

    return user;
  }
}

