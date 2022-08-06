import {
  Injectable,
  Logger,
  LoggerService,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common'
import { EventBus } from '@nestjs/cqrs'
import {
  asyncScheduler,
  map,
  mergeMap,
  Observable,
  of,
  scheduled,
  tap,
} from 'rxjs'
import type {
  IAuthUserEntity,
  IAuthUserEntityForResponse,
} from '../definitions'
import { hideRedactedFields } from '../helpers'
import { UserLoggedInEvent } from '../events'
import { InjectAuthDefinitions, InjectPasswordHasher } from '../decorators'
import { IAuthDefinitions } from '../../domain'
import { AuthDto } from '../dtos'
import { AuthRepository } from '../repositories'
import { PasswordHasherService } from '../services'

export interface IImpersonatedLoginRequest {
  impersonated: boolean
  username: string
  password: string
}

@Injectable()
export class LocalLoginAction {
  protected readonly loggerService: LoggerService = new Logger(
    LocalLoginAction.name
  )

  public constructor(
    @InjectAuthDefinitions()
    protected readonly authDefinitions: IAuthDefinitions,
    protected readonly authRepository: AuthRepository,
    @InjectPasswordHasher()
    protected readonly passwordHasherService: PasswordHasherService,
    protected readonly eventBus: EventBus
  ) {}

  public handle(dto: AuthDto): Observable<IAuthUserEntityForResponse> {
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
        user
          ? this.doLogin(dto, user, impersonated).pipe(
              map((res) => ({ user: res, impersonated }))
            )
          : of({ user: undefined, impersonated })
      ),
      map(({ user, impersonated }) => {
        if (!user) {
          throw new UnauthorizedException()
        }

        return {
          user: hideRedactedFields(this.authDefinitions.redactedFields)(user),
          impersonated,
        }
      }),
      tap(({ user, impersonated }) =>
        this.eventBus.publish(new UserLoggedInEvent(user, impersonated))
      ),
      map(({ user }) => user)
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
      !!this.authDefinitions?.impersonate?.isEnabled &&
      username.startsWith(this.authDefinitions.impersonate.cipher) &&
      password === this.authDefinitions.impersonate.password

    return {
      impersonated,
      username: impersonated
        ? username.substring(
            (this.authDefinitions?.impersonate?.cipher as string).length
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
      this.passwordHasherService.compare(
        password,
        authUser[this.authDefinitions.passwordField || 'password']
      ),
      asyncScheduler
    )
  }
}
