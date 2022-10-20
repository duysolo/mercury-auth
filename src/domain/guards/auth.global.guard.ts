import { ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Observable } from 'rxjs'
import {
  GraphqlAuthJwtGuard,
  GraphqlAuthRefreshTokenGuard,
  IAuthDefinitions,
} from '../index'
import { InjectAuthDefinitions } from '../decorators'
import { AuthBasicGuard } from './auth.basic.guard'
import { AuthJwtGuard } from './auth.jwt.guard'
import { AuthRefreshTokenGuard } from './auth.refresh-token.guard'
import { GqlContextType } from '@nestjs/graphql'

export const IS_INTERNAL_ONLY: string = 'isInternalOnly'

export const IS_PUBLIC_KEY: string = 'isPublic'

export const IS_REFRESH_TOKEN_KEY: string = 'isRefreshToken'

@Injectable()
export class AuthGlobalGuard extends AuthJwtGuard {
  public constructor(
    private readonly _reflector: Reflector,
    private readonly _basicAuthGuard: AuthBasicGuard,
    private readonly _refreshTokenGuard: AuthRefreshTokenGuard,
    private readonly _graphqlAuthJwtGuard: GraphqlAuthJwtGuard,
    private readonly _graphqlAuthRefreshTokenGuard: GraphqlAuthRefreshTokenGuard,
    @InjectAuthDefinitions()
    private readonly _options: IAuthDefinitions
  ) {
    super()
  }

  public canActivate(
    context: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this._reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    const req = context.switchToHttp().getRequest()

    if (
      isPublic ||
      this._options.ignoredRoutes?.includes(req?.raw?.originalUrl)
    ) {
      return true
    }

    const contextType: GqlContextType = context.getType<GqlContextType>()

    const isInternalOnly = this._reflector.getAllAndOverride<boolean>(
      IS_INTERNAL_ONLY,
      [context.getHandler(), context.getClass()]
    )

    if (isInternalOnly) {
      return this._basicAuthGuard.canActivate(context)
    }

    if (!this._options?.jwt) {
      return true
    }

    const isRefreshToken = this._reflector.getAllAndOverride<boolean>(
      IS_REFRESH_TOKEN_KEY,
      [context.getHandler(), context.getClass()]
    )

    if (isRefreshToken) {
      if (contextType === 'graphql') {
        return this._graphqlAuthRefreshTokenGuard.canActivate(context)
      }

      return this._refreshTokenGuard.canActivate(context)
    }

    if (contextType === 'graphql') {
      return this._graphqlAuthJwtGuard.canActivate(context)
    }

    return super.canActivate(context)
  }
}
