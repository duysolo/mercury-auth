import { HttpStatus, Injectable } from '@nestjs/common'
import { QueryBus } from '@nestjs/cqrs'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, JwtFromRequestFunction } from 'passport-jwt'
import { Strategy } from 'passport-strategy'
import { GetCurrentUserByAccessTokenQuery } from '../../application/queries'
import { InjectAuthDefinitions } from '../decorators'
import {
  cookieExtractorForAuthorization,
  headerExtractorForAuthorization,
} from '../helpers'
import { IAuthDefinitions } from '../index'

export const JWT_STRATEGY_NAME: string = 'jwt'

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
      cookieExtractorForAuthorization(authDefinitions.transferTokenMethod),
      headerExtractorForAuthorization(authDefinitions.transferTokenMethod),
    ])
  }

  public async authenticate(request: any): Promise<void> {
    const token = this._extractor(request)

    try {
      const user = await this.queryBus.execute(
        new GetCurrentUserByAccessTokenQuery(token || '')
      )

      if (user) {
        this.success(user)
      } else {
        this.fail(HttpStatus.UNAUTHORIZED)
      }
    } catch (error) {
      this.fail(HttpStatus.UNAUTHORIZED)
    }
  }
}
