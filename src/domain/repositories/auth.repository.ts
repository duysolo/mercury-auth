import { Injectable } from '@nestjs/common'
import { Observable } from 'rxjs'
import { IAuthUserEntity } from '../definitions'
import { IJwtPayload } from '../entities'

@Injectable()
export abstract class AuthRepository<
  T = string,
  TRequest = Record<string, any>
> {
  public abstract getAuthUserByUsername(
    username: string
  ): Observable<IAuthUserEntity<T> | undefined>

  public abstract authenticate(
    username: string,
    request: TRequest,
    impersonated: boolean
  ): Observable<IAuthUserEntity<T> | undefined>

  public abstract getAuthUserByAccessToken(
    accessToken: string,
    jwtPayload: IJwtPayload
  ): Observable<IAuthUserEntity<T> | undefined>

  public abstract getAuthUserByRefreshToken(
    refreshToken: string,
    jwtPayload: IJwtPayload
  ): Observable<IAuthUserEntity<T> | undefined>
}
