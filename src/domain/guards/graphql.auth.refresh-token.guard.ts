import { ExecutionContext, Injectable } from '@nestjs/common'
import { GqlExecutionContext } from '@nestjs/graphql'
import { IncomingMessage } from 'http'
import { AuthRefreshTokenGuard } from './auth.refresh-token.guard'

@Injectable()
export class GraphqlAuthRefreshTokenGuard extends AuthRefreshTokenGuard {
  public getRequest<T = IncomingMessage>(context: ExecutionContext): T {
    const ctx = GqlExecutionContext.create(context)

    return ctx.getContext().req
  }
}
