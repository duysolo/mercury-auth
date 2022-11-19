import { ExecutionContext, Injectable } from '@nestjs/common'
import { GqlExecutionContext } from '@nestjs/graphql'
import { IncomingMessage } from 'http'
import { AuthJwtGuard } from './auth.jwt.guard'

@Injectable()
export class GraphqlAuthJwtGuard extends AuthJwtGuard {
  public getRequest(context: ExecutionContext): IncomingMessage {
    const ctx = GqlExecutionContext.create(context)

    return ctx.getContext().req
  }
}
