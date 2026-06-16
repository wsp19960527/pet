import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { JwtPayload } from '@pet/shared';

export const OptionalCurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload | null => {
    const request = ctx.switchToHttp().getRequest<{ user?: JwtPayload }>();
    return request.user ?? null;
  },
);
