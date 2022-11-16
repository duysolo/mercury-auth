import { HttpStatus, Injectable } from '@nestjs/common'
import { QueryBus } from '@nestjs/cqrs'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, JwtFromRequestFunction } from 'passport-jwt'
import { Strategy } from 'passport-strategy'
import { GetCurrentUserByRefreshTokenQuery } from '../../application/queries'
import {
  AuthTransferTokenMethod,
  getRequestCookie,
  getRequestHeader,
  IAuthDefinitions,
  IHttpRequest,
} from '../index'
import { InjectAuthDefinitions } from '../decorators'

export const REFRESH_TOKEN_STRATEGY_NAME: string = 'mercury-refresh-token'

const cookieExtractor: (
  transferTokenMethod: AuthTransferTokenMethod | undefined
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
  transferTokenMethod: AuthTransferTokenMethod | undefined
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
    protected readonly queryBus: QueryBus
  ) {
    super()

    this.jwtFromRequest = ExtractJwt.fromExtractors([
      cookieExtractor(authDefinitions.transferTokenMethod),
      refreshTokenHeaderExtractor(authDefinitions.transferTokenMethod),
    ]) as any
  }

  public async authenticate(req: any): Promise<void> {
    const token: string | any = this.jwtFromRequest(req)

    const user = token
      ? await this.queryBus.execute(
          new GetCurrentUserByRefreshTokenQuery(token)
        )
      : undefined

    if (!user) {
      this.fail(HttpStatus.UNAUTHORIZED)
    } else {
      this.success(user)
    }
  }
}
