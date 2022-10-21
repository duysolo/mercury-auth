import { Injectable } from '@nestjs/common'
import _ from 'lodash/fp'
import { asyncScheduler, map, Observable, scheduled } from 'rxjs'
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
    return this.getAuthUserByUsername(username).pipe(
      map((user) => {
        if (impersonated) {
          return user
        }

        if (username !== user?.username) {
          console.log('authenticate', {
            username,
            user,
            impersonated
          })
          return undefined
        }

        return user
      })
    )
  }
}
