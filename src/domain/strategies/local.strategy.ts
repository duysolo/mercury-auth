import { Injectable } from '@nestjs/common'
import { CommandBus } from '@nestjs/cqrs'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy } from 'passport-local'
import { InjectAuthDefinitions } from '../decorators'
import type { IAuthUserEntityForResponse } from '../definitions'
import { IAuthDefinitions } from '../index'
import { LoginCommand } from '../../application/actions'

export const LOCAL_STRATEGY_NAME: string = 'local'

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  public constructor(
    @InjectAuthDefinitions()
    protected readonly authDefinitions: IAuthDefinitions,
    protected readonly bus: CommandBus
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
    return this.bus.execute(
      new LoginCommand({
        ...request.body,
        username,
        password,
      })
    )
  }
}
