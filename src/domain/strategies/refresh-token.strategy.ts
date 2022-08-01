import { HttpStatus, Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, JwtFromRequestFunction } from 'passport-jwt'
import { Strategy } from 'passport-strategy'
import { lastValueFrom, map } from 'rxjs'
import {
  getRequestCookie,
  getRequestHeader,
  hideRedactedFields,
  IAuthUserEntityForResponse,
  IHttpRequest,
  IJwtPayload,
} from '..'
import { InjectAuthDefinitions } from '../decorators'

import { IAuthDefinitions } from '../../infrastructure'
import { AuthRepository } from '../repositories'
import { AuthenticationService } from '../services'

export const REFRESH_TOKEN_STRATEGY_NAME: string = 'mercury-refresh-token'

const cookieExtractor: JwtFromRequestFunction = (
  request: IHttpRequest
  // eslint-disable-next-line @rushstack/no-new-null
): string | null => {
  return (
    (getRequestCookie(request, 'RefreshToken') as unknown as string) || null
  )
}

const refreshTokenHeaderExtractor: JwtFromRequestFunction = (
  request: IHttpRequest
  // eslint-disable-next-line @rushstack/no-new-null
): string | null => {
  return (
    (getRequestHeader(request, 'refresh-token') as unknown as string) || null
  )
}

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  REFRESH_TOKEN_STRATEGY_NAME
) {
  protected jwtFromRequest: JwtFromRequestFunction = ExtractJwt.fromExtractors([
    cookieExtractor,
    refreshTokenHeaderExtractor,
  ]) as any

  public constructor(
    @InjectAuthDefinitions()
    protected readonly authDefinitions: IAuthDefinitions,
    protected readonly authRepository: AuthRepository,
    protected readonly jwtService: AuthenticationService
  ) {
    super()
  }

  public async authenticate(req: any, options?: any): Promise<void> {
    const token: string | any = this.jwtFromRequest(req)

    const jwtPayload = token
      ? this.jwtService.decodeRefreshToken(token)
      : undefined

    const user = jwtPayload ? await this.validate(jwtPayload) : undefined

    if (!jwtPayload || !user) {
      this.fail(HttpStatus.UNAUTHORIZED)
    } else {
      this.success(user)
    }
  }

  protected async validate(
    payload: IJwtPayload
  ): Promise<IAuthUserEntityForResponse> {
    return lastValueFrom(
      this.authRepository
        .getAuthUserByUsername(payload.username)
        .pipe(map(hideRedactedFields(this.authDefinitions.redactedFields)))
    )
  }
}
