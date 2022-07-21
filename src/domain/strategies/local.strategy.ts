import { Inject, Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy } from 'passport-local'
import { lastValueFrom, map, tap } from 'rxjs'
import { IAuthUserEntityForResponse } from '..'
import {
  AUTH_DEFINITIONS_MODULE_OPTIONS,
  IAuthDefinitions,
} from '../../infrastructure'
import { LoginAction } from '../actions'
import { hideRedactedFields } from '../helpers'

export const LOCAL_STRATEGY_NAME: string = 'local'

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  public constructor(
    protected readonly loginAction: LoginAction,
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
    return lastValueFrom(
      this.loginAction.handle({ username, password }).pipe(
        tap((user) => {
          if (!user) {
            throw new UnauthorizedException()
          }
        }),
        map(hideRedactedFields(this.authDefinitions.redactedFields))
      )
    )
  }
}
