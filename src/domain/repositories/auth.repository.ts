import { Injectable } from '@nestjs/common'
import { Observable } from 'rxjs'
import { IAuthUserEntity } from '../definitions'

@Injectable()
export abstract class AuthRepository<T = string> {
  public abstract getAuthUserByUsername(
    username: string
  ): Observable<IAuthUserEntity<T> | undefined>

  public abstract authenticate(
    username: string,
    password: string,
    impersonated: boolean
  ): Observable<IAuthUserEntity<T> | undefined>
}
