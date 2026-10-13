import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AUDIENCE_KEY } from '../decorators/audience.decorator';
import { AuthenticatedUser } from '../decorators/current-user.decorator';

@Injectable()
export class AudienceGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredAudience = this.reflector.getAllAndOverride<string>(AUDIENCE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredAudience) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<{ user: AuthenticatedUser }>();

    if (!user || !user.audience) {
      throw new ForbiddenException('Phiên đăng nhập không hợp lệ hoặc thiếu định danh cổng truy cập.');
    }

    if (user.audience !== requiredAudience) {
      throw new ForbiddenException(
        `Từ chối truy cập: Token cổng '${user.audience}' không được phép thao tác tại cổng '${requiredAudience}'.`,
      );
    }

    return true;
  }
}

