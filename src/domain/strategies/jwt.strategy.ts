import { Injectable } from '@nestjs/common'
import { QueryBus } from '@nestjs/cqrs'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, JwtFromRequestFunction, Strategy } from 'passport-jwt'
import { GetCurrentUserByAccessTokenQuery } from '../../application/queries'
import { InjectAuthDefinitions } from '../decorators'
import type { IAuthUserEntityForResponse } from '../definitions'
import { AuthTransferTokenMethod } from '../definitions'
import { IJwtPayload } from '../entities'
import { getRequestCookie, getRequestHeader, IHttpRequest } from '../helpers'
import { IAuthDefinitions } from '../index'

export const JWT_STRATEGY_NAME: string = 'jwt'

const cookieExtractor: (
  transferTokenMethod: AuthTransferTokenMethod | undefined
) => JwtFromRequestFunction =
  (transferTokenMethod) =>
  (request: IHttpRequest): string | any => {
    if (transferTokenMethod === AuthTransferTokenMethod.BEARER_ONLY) {
      return null
    }

    return (
      (getRequestCookie(request, 'AccessToken') as unknown as string) || null
    )
  }

const accessTokenHeaderExtractor: (
  transferTokenMethod: AuthTransferTokenMethod | undefined
) => JwtFromRequestFunction =
  (transferTokenMethod) =>
  (request: IHttpRequest): string | any => {
    if (transferTokenMethod === AuthTransferTokenMethod.COOKIE_ONLY) {
      return null
    }

    const authHeader = getRequestHeader(request, 'authorization')

    if (!authHeader || typeof authHeader !== 'string') {
      return null
    }

    if (authHeader.toLowerCase().startsWith('bearer ')) {
      return authHeader.substring('bearer '.length)
    }

    return authHeader
  }

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, JWT_STRATEGY_NAME) {
  public constructor(
    @InjectAuthDefinitions()
    protected readonly authDefinitions: IAuthDefinitions,
    protected readonly queryBus: QueryBus
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor(authDefinitions.transferTokenMethod),
        accessTokenHeaderExtractor(authDefinitions.transferTokenMethod),
      ]),
      ignoreExpiration: false,
      secretOrKey: authDefinitions.jwt?.secret || 'NOT_DEFINED',
    })
  }

  public async validate(
    payload: IJwtPayload
  ): Promise<IAuthUserEntityForResponse | undefined> {
    return this.queryBus.execute(new GetCurrentUserByAccessTokenQuery(payload))
  }
}
