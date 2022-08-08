import { HttpStatus, UnauthorizedException } from '@nestjs/common'
import {
  createTestingModule,
  defaultAuthDefinitionsFixture
} from '../../../__tests__/helpers'
import { AuthLocalGuard } from '../auth.local.guard'
import { generateExecutionContextForLocalAuth } from './helpers/test-guard.helper'

describe('AuthLocalGuard', () => {
  const fixture = defaultAuthDefinitionsFixture()

  const validUserInfo = {
    username: 'sample-user@gmail.com',
    password: 'testLogin@12345',
  }

  beforeAll(async () => {
    await createTestingModule(defaultAuthDefinitionsFixture())
  })

  it('should allow user to login when credentials is correct', async function() {
    const guard = new AuthLocalGuard()

    expect(
      await guard.canActivate(
        generateExecutionContextForLocalAuth(
          validUserInfo.username,
          validUserInfo.password,
          fixture.usernameField || 'username',
          fixture.passwordField || 'password'
        )
      )
    ).toBeTruthy()
  })

  it('should not allow user to continue when accessToken is invalid', async function() {
    const guard = new AuthLocalGuard()

    try {
      await guard.canActivate(
        generateExecutionContextForLocalAuth(
          'invalid-user-name',
          'invalid-password',
          fixture.usernameField || 'username',
          fixture.passwordField || 'password'
        )
      )
    } catch (error) {
      expect(error).toBeInstanceOf(UnauthorizedException)
      expect(error.status).toEqual(HttpStatus.UNAUTHORIZED)
    }
  })
})
