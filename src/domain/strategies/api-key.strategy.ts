import { HttpStatus, Injectable } from '@nestjs/common'
import { QueryBus } from '@nestjs/cqrs'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, JwtFromRequestFunction } from 'passport-jwt'
import { Strategy } from 'passport-strategy'
import {
  GetCurrentUserByApiKeyQuery
} from '../../application/queries'
import { InjectAuthDefinitions } from '../decorators'
import { IAuthDefinitions } from '../definitions'
import {
  cookieExtractorForApiKey,
  headerExtractorForApiKey
} from '../helpers'

export const API_KEY_STRATEGY_NAME: string = 'mercury-api-key'

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(
  Strategy,
  API_KEY_STRATEGY_NAME
) {
  protected jwtFromRequest: JwtFromRequestFunction

  public constructor(
    @InjectAuthDefinitions()
    protected readonly authDefinitions: IAuthDefinitions,
    protected readonly queryBus: QueryBus
  ) {
    super()

    this.jwtFromRequest = ExtractJwt.fromExtractors([
      cookieExtractorForApiKey(authDefinitions.transferTokenMethod),
      headerExtractorForApiKey(authDefinitions.transferTokenMethod),
    ]) as any
  }

  public async authenticate(req: any): Promise<void> {
    const token: string | any = this.jwtFromRequest(req)

    const user = token
      ? await this.queryBus.execute(new GetCurrentUserByApiKeyQuery(token))
      : undefined

    if (!user) {
      this.fail(HttpStatus.UNAUTHORIZED)
    } else {
      this.success(user)
    }
  }
}
