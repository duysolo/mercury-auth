import { Injectable } from '@nestjs/common'
import { EventBus } from '@nestjs/cqrs'
import { map, mergeMap, Observable, of, tap } from 'rxjs'
import { InjectAuthDefinitions } from '../decorators'
import { IAuthDefinitions, IAuthResponse } from '../definitions'
import { AccessTokenGeneratedFromRefreshTokenEvent } from '../events'
import { hideRedactedFields } from '../helpers'
import { AuthRepository } from '../repositories'
import { TokenService } from '../services'

export interface IGetUserByRefreshTokenActionOptions {
  refreshToken: string
}

@Injectable()
export class GetUserByRefreshTokenAction {
  public constructor(
    @InjectAuthDefinitions()
    public readonly authDefinitions: IAuthDefinitions,
    protected readonly authRepository: AuthRepository,
    protected readonly tokenService: TokenService,
    protected readonly jwtService: TokenService,
    protected readonly eventBus: EventBus
  ) {}

  public handle({
    refreshToken,
  }: IGetUserByRefreshTokenActionOptions): Observable<
    IAuthResponse | undefined
  > {
    const jwtPayload = refreshToken
      ? this.jwtService.decodeRefreshToken(refreshToken)
      : undefined

    if (!jwtPayload) {
      return of(undefined)
    }

    return this.authRepository
      .getAuthUserByRefreshToken(refreshToken, jwtPayload)
      .pipe(
        map(hideRedactedFields(this.authDefinitions.redactedFields)),
        mergeMap((userData) => {
          if (!userData) {
            return of(undefined)
          }

          return this.tokenService.generateTokenResponse(userData).pipe(
            map((token) => {
              return {
                userData,
                token: {
                  accessToken: token.accessToken,
                  expiryDate: token.expiryDate,
                  refreshToken,
                },
              }
            }),
            tap(({ userData, token }) => {
              this.eventBus.publish(
                new AccessTokenGeneratedFromRefreshTokenEvent(
                  refreshToken,
                  userData,
                  token
                )
              )
            })
          )
        })
      )
  }
}
