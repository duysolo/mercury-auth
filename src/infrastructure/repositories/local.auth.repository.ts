import { Injectable } from '@nestjs/common'
import bcrypt from 'bcrypt'
import _ from 'lodash/fp'
import { map, Observable, of } from 'rxjs'
import { AuthRepository, IAuthUserEntity } from '../../domain'

const fixture: () => Observable<IAuthUserEntity> = () => {
  return of({
    id: _.random(1, 1999).toString(),
    username: 'duypt.dev@gmail.com',
    email: 'duypt.dev@gmail.com',
    password: bcrypt.hashSync('testLogin@12345', 10),
  })
}

@Injectable()
export class LocalAuthRepository implements AuthRepository {
  public getAuthUserByUsername(
    username: string
  ): Observable<IAuthUserEntity | undefined> {
    return fixture().pipe(
      map((user) => {
        if (username !== user.username) {
          return undefined
        }

        return user
      })
    )
  }
}
