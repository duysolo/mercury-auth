import { Injectable } from '@nestjs/common'
import { Observable } from 'rxjs'
import { IAuthUserEntity } from '..'

@Injectable()
export abstract class AuthRepository {
  public abstract getAuthUserByUsername(
    username: string
  ): Observable<IAuthUserEntity | undefined>
}
