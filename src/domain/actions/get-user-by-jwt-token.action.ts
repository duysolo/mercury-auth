import { Injectable } from '@nestjs/common'
import { asyncScheduler, map, mergeMap, Observable, of, scheduled } from 'rxjs'
import { InjectAuthDefinitions } from '../decorators'
import { IAuthDefinitions, IAuthResponse } from '../definitions'
import { IJwtPayload, JwtPayload } from '../entities'
import { hideRedactedFields, validateEntity } from '../helpers'
import { AuthRepository } from '../repositories'
import { TokenService } from '../services'

export interface IGetUserByJwtTokenActionOptions {
  jwtPayload: IJwtPayload
  accessToken: string
}

@Injectable()
export class GetUserByJwtTokenAction {
  public constructor(
    @InjectAuthDefinitions()
    public readonly authDefinitions: IAuthDefinitions,
    public readonly authRepository: AuthRepository,
    public readonly jwtService: TokenService
  ) {}

  public handle({
    jwtPayload,
    accessToken,
  }: IGetUserByJwtTokenActionOptions): Observable<IAuthResponse | undefined> {
    return scheduled(
      validateEntity(jwtPayload, JwtPayload, false),
      asyncScheduler
    ).pipe(
      map((res) => {
        return this.jwtService.decodeAccessTokenFromRawDecoded(res)
      }),
      mergeMap((validatedPayload) => {
        if (!validatedPayload?.username) {
          return of(undefined)
        }

        return this.authRepository
          .getAuthUserByAccessToken(accessToken, validatedPayload)
          .pipe(map(hideRedactedFields(this.authDefinitions.redactedFields)))
      }),
      map((userData) => {
        if (!userData) {
          return undefined
        }

        return { userData, token: { accessToken } }
      })
    )
  }
}
