import { Inject, Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy } from 'passport-local'
import { lastValueFrom } from 'rxjs'
import { IAuthUserEntityForResponse } from '..'
import {
  AUTH_DEFINITIONS_MODULE_OPTIONS,
  IAuthDefinitions,
} from '../../auth-definitions.module'
import { LocalLoginAction } from '../actions'

export const LOCAL_STRATEGY_NAME: string = 'local'

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  public constructor(
    protected readonly loginAction: LocalLoginAction,
    @Inject(AUTH_DEFINITIONS_MODULE_OPTIONS)
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
