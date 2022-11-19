import { Injectable } from '@nestjs/common'
import _ from 'lodash/fp'
import { asyncScheduler, map, Observable, scheduled } from 'rxjs'
import {
  AuthDto,
  AuthRepository,
  IAuthUserEntity, IJwtPayload,
  InjectPasswordHasher,
  PasswordHasherService,
} from '../../domain'

@Injectable()
export class SampleAuthRepository implements AuthRepository<string, AuthDto> {
  public constructor(
    @InjectPasswordHasher()
    protected readonly hasher: PasswordHasherService
  ) {}

  public getAuthUserByUsername(
    username: string
  ): Observable<IAuthUserEntity | undefined> {
    return scheduled(this.hasher.hash('testLogin@12345'), asyncScheduler).pipe(
      map((password: string) => ({
        id: _.random(1, 1999).toString(),
        username: 'sample-user@gmail.com',
        email: 'sample-user@gmail.com',
        password,
      }))
    )
  }

  public authenticate(
    username: string,
    request: AuthDto,
    impersonated: boolean
  ): Observable<IAuthUserEntity | undefined> {
    return this.getAuthUserByUsername(username).pipe(
      map((user) => {
        if (impersonated) {
          return user
        }

        /**
         * Do some additional logics
         */

        return user
      })
    )
  }

  public getAuthUserByAccessToken(
    accessToken: string,
    jwtPayload: IJwtPayload
  ): Observable<IAuthUserEntity | undefined> {
    /**
     * You can check the token if it's stored in database.
     */

    return this.getAuthUserByUsername(jwtPayload.username)
  }

  public getAuthUserByRefreshToken(
    refreshToken: string,
    jwtPayload: IJwtPayload
  ): Observable<IAuthUserEntity | undefined> {
    /**
     * You can check the token if it's stored in database.
     */

    return this.getAuthUserByUsername(jwtPayload.username)
  }
}
