import { IAuthDefinitions, IAuthUserEntityForResponse } from '../definitions'
import { Injectable } from '@nestjs/common'
import { IJwtPayload, JwtPayload } from '../entities'
import { asyncScheduler, map, mergeMap, Observable, of, scheduled } from 'rxjs'
import { hideRedactedFields, validateEntity } from '../helpers'
import { InjectAuthDefinitions } from '../decorators'
import { AuthRepository } from '../repositories'
import { TokenService } from '../services'

@Injectable()
export class GetUserByJwtTokenAction {
  public constructor(
    @InjectAuthDefinitions()
    public readonly authDefinitions: IAuthDefinitions,
    public readonly authRepository: AuthRepository,
    public readonly jwtService: TokenService
  ) {}

  public handle(
    dto: IJwtPayload
  ): Observable<IAuthUserEntityForResponse | undefined> {
    return scheduled(
      validateEntity(dto, JwtPayload, false),
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
          .getAuthUserByUsername(validatedPayload.username)
          .pipe(map(hideRedactedFields(this.authDefinitions.redactedFields)))
      })
    )
  }
}
