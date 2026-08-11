import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import type { Request } from 'express';

import { JwtPayload } from '../interfaces/jwt-payload.interface';

/** Trả về userId (JwtPayload.sub) của request đã xác thực - gắn bởi JwtStrategy. */
export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): string => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user: JwtPayload }>();
    return request.user.sub;
  },
);
