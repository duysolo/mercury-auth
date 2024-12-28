import { ExecutionContext, Injectable } from '@nestjs/common'
import { GqlExecutionContext } from '@nestjs/graphql'
import { IncomingMessage } from 'http'
import { AuthApiKeyGuard } from './auth.api-key.guard'

@Injectable()
export class GraphqlAuthApiKeyGuard extends AuthApiKeyGuard {
  public getRequest<T = IncomingMessage>(context: ExecutionContext): T {
    const ctx = GqlExecutionContext.create(context)

    return ctx.getContext().req
  }
}
