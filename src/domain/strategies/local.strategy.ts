import { Injectable } from '@nestjs/common'
import { QueryBus } from '@nestjs/cqrs'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy } from 'passport-local'
import { LoginQuery } from '../../application/queries'
import { InjectAuthDefinitions } from '../decorators'
import type { IAuthUserEntityForResponse } from '../definitions'
import { IAuthDefinitions } from '../index'

export const LOCAL_STRATEGY_NAME: string = 'local'

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  public constructor(
    @InjectAuthDefinitions()
    protected readonly authDefinitions: IAuthDefinitions,
    protected readonly queryBus: QueryBus
  ) {
    super({
      usernameField: authDefinitions.usernameField || 'username',
      passwordField: authDefinitions.passwordField || 'password',
      passReqToCallback: true,
    })
  }

  public async validate(
    request: any,
    username: string,
    password: string
  ): Promise<IAuthUserEntityForResponse> {
    return this.queryBus.execute(
      new LoginQuery({
        ...request.body,
        username,
        password,
      })
    )
  }
}
