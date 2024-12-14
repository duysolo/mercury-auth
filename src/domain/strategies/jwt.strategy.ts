import { HttpStatus, Injectable } from '@nestjs/common'
import { QueryBus } from '@nestjs/cqrs'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, JwtFromRequestFunction } from 'passport-jwt'
import { Strategy } from 'passport-strategy'
import { GetCurrentUserByAccessTokenQuery } from '../../application/queries'
import { InjectAuthDefinitions } from '../decorators'
import { AuthTransferTokenMethod } from '../definitions'
import {
  getRequestCookie,
  getRequestHeader,
  IHttpRequest,
  removeBearerFromToken,
} from '../helpers'
import { IAuthDefinitions } from '../index'

export const JWT_STRATEGY_NAME: string = 'jwt'

export const cookieExtractor: (
  transferTokenMethod: AuthTransferTokenMethod | undefined
) => JwtFromRequestFunction =
  (transferTokenMethod) =>
  (request: IHttpRequest): string | any => {
    if (transferTokenMethod === AuthTransferTokenMethod.BEARER_ONLY) {
      return null
    }

    return (
      removeBearerFromToken(
        getRequestCookie(request, 'AccessToken') as unknown as string
      ) || null
    )
  }

export const accessTokenHeaderExtractor: (
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

    return removeBearerFromToken(authHeader)
  }

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, JWT_STRATEGY_NAME) {
  private readonly _extractor: JwtFromRequestFunction

  public constructor(
    @InjectAuthDefinitions()
    protected readonly authDefinitions: IAuthDefinitions,
    protected readonly queryBus: QueryBus
  ) {
    super()

    this._extractor = ExtractJwt.fromExtractors([
      cookieExtractor(authDefinitions.transferTokenMethod),
      accessTokenHeaderExtractor(authDefinitions.transferTokenMethod),
    ])
  }

  public async authenticate(request: any): Promise<void> {
    const token = this._extractor(request)

    const user = await this.queryBus.execute(
      new GetCurrentUserByAccessTokenQuery(token || '')
    )

    if (user) {
      this.success(user)
    } else {
      this.fail(HttpStatus.UNAUTHORIZED)
    }
  }
}
