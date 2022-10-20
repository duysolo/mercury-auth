import { ExecutionContext, Injectable } from '@nestjs/common'
import { AuthRefreshTokenGuard } from './auth.refresh-token.guard'
import { IncomingMessage } from 'http'
import { GqlExecutionContext } from '@nestjs/graphql'

@Injectable()
export class GraphqlAuthRefreshTokenGuard extends AuthRefreshTokenGuard {
  public getRequest(context: ExecutionContext): IncomingMessage {
    const ctx = GqlExecutionContext.create(context)

    return ctx.getContext().req
  }
}
