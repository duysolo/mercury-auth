import { Injectable } from '@nestjs/common'

import crypto from 'crypto'
import {
  AUTH_PASSWORD_HASHER,
  AuthBasicGuard,
  AuthRefreshTokenGuard,
  AuthRepository,
  JwtStrategy,
  LocalLoginAction,
  LocalStrategy,
  PasswordHasherService,
  RefreshTokenStrategy,
  TokenService,
} from '../domain'
import {
  ClearAuthCookieInterceptor,
  CookieAuthInterceptor,
  LoginController,
  ProfileController,
  RefreshTokenController,
} from '../presentation'
import { LogoutController } from '../presentation/controllers/logout.controller'
import { createTestingModule, defaultAuthDefinitionsFixture } from './helpers'

interface IPbkdf2Hash {
  hash: string
  salt: string
}

@Injectable()
class Pbkdf2PasswordHasherService
  implements PasswordHasherService<IPbkdf2Hash>
{
  public async hash(password: string): Promise<IPbkdf2Hash> {
    const salt = crypto.randomBytes(16).toString('hex')

    const hash = crypto
      .pbkdf2Sync(password, salt, 10000, 512, 'sha512')
      .toString('hex')

    return { salt, hash }
  }

  public async compare(
    password: string,
    hashedPassword: IPbkdf2Hash
  ): Promise<boolean> {
    const hashPassword = crypto
      .pbkdf2Sync(password, hashedPassword.salt, 10000, 512, 'sha512')
      .toString('hex')

    return hashedPassword.hash === hashPassword
  }
}

describe('AuthModule', () => {
  it('all relevant controllers/providers should be defined', async function () {
    const app = await createTestingModule(defaultAuthDefinitionsFixture())

    const items: any[] = [
      LoginController,
      LogoutController,
      ProfileController,
      RefreshTokenController,

      AUTH_PASSWORD_HASHER,
      AuthRepository,
      TokenService,
      LocalLoginAction,

      LocalStrategy,
      JwtStrategy,
      RefreshTokenStrategy,

      AuthBasicGuard,
      AuthRefreshTokenGuard,

      ClearAuthCookieInterceptor,
      CookieAuthInterceptor,
    ]

    items.forEach((item) => {
      expect(app.get(item)).toBeDefined()
    })
  })

  it('should allow user to customize hasher algorithm', async () => {
    const app = await createTestingModule(defaultAuthDefinitionsFixture(), {
      passwordHasher: {
        useFactory: () => {
          return new Pbkdf2PasswordHasherService()
        },
      },
    })

    expect(app.get(AUTH_PASSWORD_HASHER)).toBeInstanceOf(
      Pbkdf2PasswordHasherService
    )
  })
})
