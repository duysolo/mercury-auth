import { Injectable } from '@nestjs/common'
import {
  asyncScheduler,
  forkJoin,
  map,
  mergeMap,
  Observable,
  of,
  scheduled,
} from 'rxjs'
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

  public handle<T = IAuthResponse>({
    jwtPayload,
    accessToken,
  }: IGetUserByJwtTokenActionOptions): Observable<IAuthResponse | undefined> {
    return scheduled(
      validateEntity(jwtPayload, JwtPayload, false),
      asyncScheduler
    ).pipe(
      map((res) => {
        return this.jwtService.decodeTokenFromRawDecoded(res)
      }),
      mergeMap((validatedPayload) => {
        if (!validatedPayload?.username) {
          return of(undefined)
        }

        return forkJoin([
          this.authRepository.getAuthUserByAccessToken(
            accessToken,
            validatedPayload
          ),
        ]).pipe(
          map(([res]) => res),
          map(hideRedactedFields(this.authDefinitions.redactedFields))
        )
      }),
      map((userData) => {
        if (!userData) {
          return undefined
        }

        return { userData }
      })
    )
  }
}
