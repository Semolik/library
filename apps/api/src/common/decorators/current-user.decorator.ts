import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserNotFoundError } from '@common/exceptions';

export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const user = request.user;

  if (!user) {
    throw new UserNotFoundError();
  }

  return user;
});

