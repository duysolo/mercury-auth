import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import type { IAuthUserEntityForResponse, IRequestWithUser } from '../../domain'

export const CurrentUser: () => ParameterDecorator = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): IAuthUserEntityForResponse => {
    const request: IRequestWithUser = ctx.switchToHttp().getRequest()

    return request.user
  }
)
