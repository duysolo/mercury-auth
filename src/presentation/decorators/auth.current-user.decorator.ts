import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import type {
  IAuthResponse,
  IAuthUserEntityForResponse,
  IRequestWithUser,
} from '../../domain'
import { GqlExecutionContext } from '@nestjs/graphql'

export function currentUserDecoratorFactory(
  data: unknown,
  context: ExecutionContext
): IAuthResponse {
  if (`${context.getType()}` === 'graphql') {
    const gqlExecutionContext = GqlExecutionContext.create(context)

    return gqlExecutionContext.getContext().req.user
  }

  const request: IRequestWithUser = context.switchToHttp().getRequest()

  return request.user
}

export function currentUserWithoutTokenDecoratorFactory(
  data: unknown,
  context: ExecutionContext
): IAuthUserEntityForResponse {
  const user: IAuthResponse = currentUserDecoratorFactory(data, context)

  return user?.userData
}

export const CurrentUser: ReturnType<
  typeof createParamDecorator<any, any, IAuthUserEntityForResponse>
> = createParamDecorator(currentUserWithoutTokenDecoratorFactory)

export const CurrentUserWithToken: ReturnType<
  typeof createParamDecorator<any, any, IAuthUserEntityForResponse>
> = createParamDecorator(currentUserDecoratorFactory)
