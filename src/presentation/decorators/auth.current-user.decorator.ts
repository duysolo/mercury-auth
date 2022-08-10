import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import type { IAuthUserEntityForResponse, IRequestWithUser } from '../../domain'

export function currentUserDecoratorFactory(
  data: unknown,
  ctx: ExecutionContext
): IAuthUserEntityForResponse {
  const request: IRequestWithUser = ctx.switchToHttp().getRequest()

  return request.user
}

export const CurrentUser: () => ParameterDecorator = createParamDecorator(
  currentUserDecoratorFactory
)
