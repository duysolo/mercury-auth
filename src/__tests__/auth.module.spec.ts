import { TestingModule } from '@nestjs/testing'
import {
  AUTH_PASSWORD_HASHER,
  AuthBasicGuard,
  AuthenticationService,
  AuthRefreshTokenGuard,
  AuthRepository,
  JwtStrategy,
  LocalLoginAction,
  LocalStrategy,
  RefreshTokenStrategy,
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

describe('AuthModule', () => {
  let app: TestingModule

  beforeEach(async () => {
    app = await createTestingModule(defaultAuthDefinitionsFixture)
  })

  it('all relevant controllers/providers should be defined', function () {
    expect(app.get(LoginController)).toBeDefined()
    expect(app.get(LogoutController)).toBeDefined()
    expect(app.get(ProfileController)).toBeDefined()
    expect(app.get(RefreshTokenController)).toBeDefined()

    expect(app.get(AUTH_PASSWORD_HASHER)).toBeDefined()
    expect(app.get(AuthRepository)).toBeDefined()
    expect(app.get(AuthenticationService)).toBeDefined()
    expect(app.get(LocalLoginAction)).toBeDefined()

    expect(app.get(LocalStrategy)).toBeDefined()
    expect(app.get(JwtStrategy)).toBeDefined()
    expect(app.get(RefreshTokenStrategy)).toBeDefined()

    expect(app.get(AuthBasicGuard)).toBeDefined()
    expect(app.get(AuthRefreshTokenGuard)).toBeDefined()

    expect(app.get(ClearAuthCookieInterceptor)).toBeDefined()
    expect(app.get(CookieAuthInterceptor)).toBeDefined()
  })
})
