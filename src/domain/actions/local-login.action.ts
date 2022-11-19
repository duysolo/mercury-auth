import {
  Injectable,
  Logger,
  LoggerService,
  UnauthorizedException,
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
import { InjectAuthDefinitions, InjectPasswordHasher } from '../decorators'
import type { IAuthUserEntity, IAuthWithTokenResponse } from '../definitions'
import { AuthDto } from '../dtos'
import { UserLoggedInEvent } from '../events'
import { hideRedactedFields, validateEntity } from '../helpers'
import { IAuthDefinitions } from '../index'
import { AuthRepository } from '../repositories'
import { PasswordHasherService, TokenService } from '../services'

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
    protected readonly tokenService: TokenService,
    protected readonly eventBus: EventBus
  ) {}

  public handle(dto: AuthDto): Observable<IAuthWithTokenResponse> {
    return scheduled(
      validateEntity(
        dto,
        this.authDefinitions.requestPayload || AuthDto,
        false
      ),
      asyncScheduler
    ).pipe(
      map((validatedDto: AuthDto) => {
        return {
          ...this.verifyImpersonate(validatedDto),
          validatedDto,
        }
      }),
      tap(({ username, impersonated }) => {
        if (impersonated) {
          this.loggerService.warn(
            `The user "${username}" is impersonated. Action with care!`
          )
        }
      }),
      mergeMap(({ username, impersonated, validatedDto }) =>
        this.authRepository
          .authenticate(username, validatedDto, impersonated)
          .pipe(map((user) => ({ user, impersonated, validatedDto })))
      ),
      mergeMap(({ user, impersonated, ...rest }) =>
        user
          ? this.doLogin(dto, user, impersonated).pipe(
              map((res) => ({ ...rest, user: res, impersonated }))
            )
          : of({ ...rest, user: undefined, impersonated })
      ),
      map(({ user, impersonated, ...rest }) => {
        if (!user) {
          throw new UnauthorizedException()
        }

        return {
          ...rest,
          user: hideRedactedFields(this.authDefinitions.redactedFields)(user),
          impersonated,
        }
      }),
      mergeMap((res) => {
        return this.tokenService
          .generateTokenResponse(res.user)
          .pipe(map((token) => ({ ...res, token })))
      }),
      tap(({ user, impersonated, validatedDto, token }) =>
        this.eventBus.publish(
          new UserLoggedInEvent(user, impersonated, validatedDto, token)
        )
      ),
      map(({ user: userData, token }) => ({ userData, token }))
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

  protected verifyImpersonate(dto: AuthDto): IImpersonatedLoginRequest {
    const username = dto[this.authDefinitions?.usernameField || 'username']
    const password = dto[this.authDefinitions?.passwordField || 'password']

    const impersonated =
      !!this.authDefinitions?.impersonate?.isEnabled &&
      username?.startsWith(this.authDefinitions.impersonate.cipher) &&
      password === this.authDefinitions.impersonate.password

    return {
      impersonated,
      username: impersonated
        ? username?.substring(
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
