// Minh Pham
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Custom decorator to easily extract user info from the request (e.g., from JWT)
export const GetUserInfo = createParamDecorator(
  (data: keyof any, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
