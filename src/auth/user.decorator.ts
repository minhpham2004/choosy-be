// Minh Pham, Nathan Ravasini
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetUserInfo = createParamDecorator(
  (data: keyof any, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
