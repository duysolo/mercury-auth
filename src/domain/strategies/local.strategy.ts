import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy } from 'passport-local'
import { lastValueFrom } from 'rxjs'
import { IAuthDefinitions } from '../../domain'
import { LocalLoginAction } from '../actions'
import { InjectAuthDefinitions } from '../decorators'
import type { IAuthUserEntityForResponse } from '../definitions'

export const LOCAL_STRATEGY_NAME: string = 'local'

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  public constructor(
    @InjectAuthDefinitions()
    protected readonly authDefinitions: IAuthDefinitions,
    protected readonly loginAction: LocalLoginAction
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
