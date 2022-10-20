import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import type { IAuthUserEntityForResponse, IRequestWithUser } from '../../domain'
import { GqlExecutionContext } from '@nestjs/graphql'

export function currentUserDecoratorFactory(
  data: unknown,
  context: ExecutionContext
): IAuthUserEntityForResponse {
  console.log(context)

  if (`${context.getType()}` === 'graphql') {
    const gqlExecutionContext = GqlExecutionContext.create(context)

    return gqlExecutionContext.getContext().req.user
  }

  const request: IRequestWithUser = context.switchToHttp().getRequest()

  return request.user
}

export const CurrentUser: ReturnType<
  typeof createParamDecorator<any, any, IAuthUserEntityForResponse>
> = createParamDecorator(currentUserDecoratorFactory)
