import { HttpStatus, UnauthorizedException } from '@nestjs/common'
import { TestingModule } from '@nestjs/testing/testing-module'
import {
  createTestingModule,
  defaultAuthDefinitionsFixture,
} from '../../../__tests__/helpers'
import { AuthLocalGuard } from '../auth.local.guard'
import { generateExecutionContextForLocalAuth } from './helpers/test-guard.helper'

describe('AuthLocalGuard', () => {
  const fixture = defaultAuthDefinitionsFixture()

  const validUserInfo = {
    username: 'sample-user@gmail.com',
    password: 'testLogin@12345',
  }

  let app: TestingModule

  beforeAll(async () => {
    app = await createTestingModule(fixture)

    await app.init()
  })

  it('should allow user to login when credentials is correct', async function () {
    const guard = app.get(AuthLocalGuard)

    expect(
      await guard.canActivate(
        generateExecutionContextForLocalAuth(
          validUserInfo.username,
          validUserInfo.password
        )
      )
    ).toBeTruthy()
  })

  it('should not allow user to continue when accessToken is invalid', async function () {
    const guard = app.get(AuthLocalGuard)

    try {
      await guard.canActivate(
        generateExecutionContextForLocalAuth(
          'invalid-user-name',
          'invalid-password'
        )
      )
    } catch (error) {
      expect(error).toBeInstanceOf(UnauthorizedException)
      expect(error.status).toEqual(HttpStatus.UNAUTHORIZED)
    }
  })
})
