import { ExecutionContext, Injectable } from '@nestjs/common'
import { CanActivate } from '@nestjs/common/interfaces/features/can-activate.interface'
import { Reflector } from '@nestjs/core'
import { GqlContextType } from '@nestjs/graphql'
import { catchError, forkJoin, map, Observable, of, throwError } from 'rxjs'
import { InjectAuthDefinitions } from '../decorators'
import {
  GraphqlAuthJwtGuard,
  GraphqlAuthRefreshTokenGuard,
  IAuthDefinitions,
} from '../index'
import { AuthBasicGuard } from './auth.basic.guard'
import { AuthJwtGuard } from './auth.jwt.guard'
import { AuthRefreshTokenGuard } from './auth.refresh-token.guard'

export const IS_INTERNAL_ONLY: string = 'isInternalOnly'

export const IS_PUBLIC_KEY: string = 'isPublic'

export const IS_PUBLIC_WITH_OPTIONAL_USER_KEY: string =
  'isPublicWithOptionalUser'

export const IS_REFRESH_TOKEN_KEY: string = 'isRefreshToken'

@Injectable()
export class AuthGlobalGuard {
  public constructor(
    private readonly _reflector: Reflector,
    private readonly _authJwtGuard: AuthJwtGuard,
    private readonly _basicAuthGuard: AuthBasicGuard,
    private readonly _refreshTokenGuard: AuthRefreshTokenGuard,
    private readonly _graphqlAuthJwtGuard: GraphqlAuthJwtGuard,
    private readonly _graphqlAuthRefreshTokenGuard: GraphqlAuthRefreshTokenGuard,
    @InjectAuthDefinitions()
    private readonly _options: IAuthDefinitions
  ) {}

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

    const isPublicWithOptionalUser = this._reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_WITH_OPTIONAL_USER_KEY,
      [context.getHandler(), context.getClass()]
    )

    if (contextType === 'graphql') {
      return this.handleJwtRequestWithOptionalUser(
        this._graphqlAuthJwtGuard,
        context,
        isPublicWithOptionalUser
      )
    }

    return this.handleJwtRequestWithOptionalUser(
      this._authJwtGuard,
      context,
      isPublicWithOptionalUser
    )
  }

  protected handleJwtRequestWithOptionalUser(
    handler: CanActivate,
    context: ExecutionContext,
    isPublicWithOptionalUser: boolean
  ) {
    return forkJoin([handler.canActivate(context) as Promise<boolean>]).pipe(
      map(([res]) => {
        return isPublicWithOptionalUser ? true : res
      }),
      catchError((error) => {
        if (isPublicWithOptionalUser) {
          return of(true)
        }

        return throwError(() => error)
      })
    )
  }
}
