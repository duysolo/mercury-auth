import { HttpStatus, Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, JwtFromRequestFunction } from 'passport-jwt'
import { Strategy } from 'passport-strategy'
import { lastValueFrom, map } from 'rxjs'
import {
  AuthTransferTokenMethod,
  getRequestCookie,
  getRequestHeader,
  hideRedactedFields,
  IAuthUserEntityForResponse,
  IHttpRequest,
  IJwtPayload,
} from '..'

import { IAuthDefinitions } from '../../infrastructure'
import { InjectAuthDefinitions } from '../decorators'
import { AuthRepository } from '../repositories'
import { AuthenticationService } from '../services'

export const REFRESH_TOKEN_STRATEGY_NAME: string = 'mercury-refresh-token'

const cookieExtractor: (
  transferTokenMethod: AuthTransferTokenMethod
) => JwtFromRequestFunction =
  (transferTokenMethod) =>
  (request: IHttpRequest): string | any => {
    if (transferTokenMethod === AuthTransferTokenMethod.BEARER_ONLY) {
      return null
    }

    return (
      (getRequestCookie(request, 'RefreshToken') as unknown as string) || null
    )
  }

const refreshTokenHeaderExtractor: (
  transferTokenMethod: AuthTransferTokenMethod
) => JwtFromRequestFunction =
  (transferTokenMethod) =>
  (request: IHttpRequest): string | any => {
    if (transferTokenMethod === AuthTransferTokenMethod.COOKIE_ONLY) {
      return null
    }

    return (
      (getRequestHeader(request, 'refresh-token') as unknown as string) || null
    )
  }

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  REFRESH_TOKEN_STRATEGY_NAME
) {
  protected jwtFromRequest: JwtFromRequestFunction

  public constructor(
    @InjectAuthDefinitions()
    protected readonly authDefinitions: IAuthDefinitions,
    protected readonly authRepository: AuthRepository,
    protected readonly jwtService: AuthenticationService
  ) {
    super()

    this.jwtFromRequest = ExtractJwt.fromExtractors([
      cookieExtractor(authDefinitions.transferTokenMethod),
      refreshTokenHeaderExtractor(authDefinitions.transferTokenMethod),
    ]) as any
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
