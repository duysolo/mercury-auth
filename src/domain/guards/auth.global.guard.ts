import { ExecutionContext, Inject, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Observable } from 'rxjs'
import {
  AUTH_DEFINITIONS_MODULE_OPTIONS,
  IAuthDefinitions,
} from '../../auth-definitions.module'
import { IS_INTERNAL_ONLY, IS_PUBLIC_KEY, IS_REFRESH_TOKEN_KEY } from '../../'
import { AuthBasicGuard } from './auth.basic.guard'
import { AuthJwtGuard } from './auth.jwt.guard'
import { AuthRefreshTokenGuard } from './auth.refresh-token.guard'

@Injectable()
export class AuthGlobalGuard extends AuthJwtGuard {
  public constructor(
    private readonly _reflector: Reflector,
    private readonly _basicAuthGuard: AuthBasicGuard,
    private readonly _refreshTokenGuard: AuthRefreshTokenGuard,
    @Inject(AUTH_DEFINITIONS_MODULE_OPTIONS)
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

    const isInternalOnly = this._reflector.getAllAndOverride<boolean>(
      IS_INTERNAL_ONLY,
      [context.getHandler(), context.getClass()]
    )

    if (isInternalOnly) {
      return this._basicAuthGuard.canActivate(context)
    }

    const isRefreshToken = this._reflector.getAllAndOverride<boolean>(
      IS_REFRESH_TOKEN_KEY,
      [context.getHandler(), context.getClass()]
    )

    if (isRefreshToken) {
      return this._refreshTokenGuard.canActivate(context)
    }

    return super.canActivate(context)
  }
}
