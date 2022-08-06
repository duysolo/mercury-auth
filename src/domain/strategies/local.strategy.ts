import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy } from 'passport-local'
import { lastValueFrom } from 'rxjs'
import type { IAuthUserEntityForResponse } from '../definitions'
import { InjectAuthDefinitions } from '../decorators'
import { IAuthDefinitions } from '../../domain'
import { LocalLoginAction } from '../actions'

export const LOCAL_STRATEGY_NAME: string = 'local'

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  public constructor(
    protected readonly loginAction: LocalLoginAction,
    @InjectAuthDefinitions()
    protected readonly authDefinitions: IAuthDefinitions
  ) {
    super({
      usernameField: authDefinitions.usernameField || 'username',
      passwordField: authDefinitions.passwordField || 'password',
    })
  }

  public async validate(
    username: string,
    password: string
  ): Promise<IAuthUserEntityForResponse> {
    return lastValueFrom(this.loginAction.handle({ username, password }))
  }
}
