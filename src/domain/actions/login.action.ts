import {
  Inject,
  Injectable,
  Logger,
  LoggerService,
  ValidationPipe,
} from '@nestjs/common'
import {
  asyncScheduler,
  map,
  mergeMap,
  Observable,
  of,
  scheduled,
  tap,
} from 'rxjs'
import { IAuthUserEntity, IAuthUserEntityForResponse } from '..'
import { PasswordHasherService } from '../services'
import {
  AUTH_DEFINITIONS_MODULE_OPTIONS,
  IAuthDefinitions,
} from '../../auth-definitions.module'
import { AuthDto } from '../dtos'
import { AuthRepository } from '../repositories'

export interface IImpersonatedLoginRequest {
  impersonated: boolean
  username: string
  password: string
}

@Injectable()
export class LoginAction {
  protected readonly loggerService: LoggerService = new Logger(LoginAction.name)

  public constructor(
    @Inject(AUTH_DEFINITIONS_MODULE_OPTIONS)
    protected readonly options: IAuthDefinitions,
    protected readonly authRepository: AuthRepository,
    protected readonly passwordHasherService: PasswordHasherService
  ) {}

  public handle(
    dto: AuthDto
  ): Observable<IAuthUserEntityForResponse | undefined> {
    return scheduled(
      new ValidationPipe({
        transform: true,
        whitelist: true,
      }).transform(dto, { type: 'body', metatype: AuthDto }),
      asyncScheduler
    ).pipe(
      map((validatedDto: AuthDto) => this.verifyImpersonate(validatedDto)),
      tap(({ username, impersonated }) => {
        if (impersonated) {
          this.loggerService.warn(
            `The user "${username}" is impersonated. Action with care!`
          )
        }
      }),
      mergeMap(({ username, password, impersonated }) =>
        this.authRepository
          .getAuthUserByUsername(username)
          .pipe(map((user) => ({ user, impersonated })))
      ),
      mergeMap(({ user, impersonated }) =>
        user ? this.doLogin(dto, user, impersonated) : of(undefined)
      )
    )
  }

  protected doLogin(
    dto: AuthDto,
    user: IAuthUserEntity,
    impersonated: boolean
  ): Observable<IAuthUserEntity | undefined> {
    if (!user) {
      this.loggerService.warn(`User ${dto.username} not found. Unauthorized!`)

      return of(undefined)
    }

    if (impersonated) {
      return of(user)
    }

    return this.verifyPassword(dto.password, user).pipe(
      map((success) => (!success ? undefined : user))
    )
  }

  protected verifyImpersonate({
    username,
    password,
  }: AuthDto): IImpersonatedLoginRequest {
    const impersonated =
      !!this.options?.impersonate?.isEnabled &&
      username.startsWith(this.options.impersonate.cipher) &&
      password === this.options.impersonate.password

    return {
      impersonated,
      username: impersonated
        ? username.substring(
            (this.options?.impersonate?.cipher as string).length
          )
        : username,
      password,
    }
  }

  protected verifyPassword(
    password: string,
    authUser: IAuthUserEntity
  ): Observable<boolean> {
    return scheduled(
      this.passwordHasherService.compare(password, authUser.password || ''),
      asyncScheduler
    )
  }
}
