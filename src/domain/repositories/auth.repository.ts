import { Injectable } from '@nestjs/common'
import { Observable } from 'rxjs'
import { IAuthUserEntity } from '..'

@Injectable()
export abstract class AuthRepository<T> {
  public abstract getAuthUserByUsername(
    username: string
  ): Observable<IAuthUserEntity<T> | undefined>
}
