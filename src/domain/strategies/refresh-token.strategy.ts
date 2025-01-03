import { HttpStatus, Injectable } from '@nestjs/common'
import { QueryBus } from '@nestjs/cqrs'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, JwtFromRequestFunction } from 'passport-jwt'
import { Strategy } from 'passport-strategy'
import { GetCurrentUserByRefreshTokenQuery } from '../../application/queries'
import { InjectAuthDefinitions } from '../decorators'
import { IAuthDefinitions } from '../definitions'
import {
  cookieExtractorForRefreshToken,
  headerExtractorForRefreshToken
} from '../helpers'

export const REFRESH_TOKEN_STRATEGY_NAME: string = 'mercury-refresh-token'

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
      cookieExtractorForRefreshToken(authDefinitions.transferTokenMethod),
      headerExtractorForRefreshToken(authDefinitions.transferTokenMethod),
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
