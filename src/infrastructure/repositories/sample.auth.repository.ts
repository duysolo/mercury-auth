import { Injectable } from '@nestjs/common'
import _ from 'lodash/fp'
import {
  asyncScheduler,
  catchError,
  map,
  Observable,
  of,
  scheduled,
  tap,
} from 'rxjs'
import {
  AuthRepository,
  IAuthUserEntity,
  InjectPasswordHasher,
  PasswordHasherService,
} from '../../domain'

@Injectable()
export class SampleAuthRepository implements AuthRepository {
  public constructor(
    @InjectPasswordHasher()
    protected readonly hasher: PasswordHasherService
  ) {
  }

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
    password: string,
    impersonated: boolean
  ): Observable<IAuthUserEntity | undefined> {
    if (impersonated) {
      return this.getAuthUserByUsername(username).pipe(
        catchError(() => {
          return of(undefined)
        })
      )
    }

    return scheduled(this.hasher.hash(password), asyncScheduler).pipe(
      map((password: string) => ({
        id: _.random(1, 1999).toString(),
        username: 'sample-user@gmail.com',
        email: 'sample-user@gmail.com',
        password,
      })),
      tap((res: IAuthUserEntity) => {
        /**
         * Some sample logic check
         */
        if (res.password !== password) {
          return of(undefined)
        }
      })
    )
  }
}
