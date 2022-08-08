import { HttpStatus, UnauthorizedException } from '@nestjs/common'
import { lastValueFrom, map } from 'rxjs'
import {
  createTestingModule,
  defaultAuthDefinitionsFixture,
} from '../../../__tests__/helpers'
import { IAuthUserEntityForResponse } from '../../definitions'
import { TokenService } from '../../services'
import { AuthRefreshTokenGuard } from '../auth.refresh-token.guard'
import { generateExecutionContextForRefreshTokenStrategy } from './helpers/test-guard.helper'

describe('AuthRefreshTokenGuard', () => {
  let correctRefreshToken: string

  beforeAll(async () => {
    const userInfo: IAuthUserEntityForResponse = {
      id: '123456',
      username: 'sample-user@gmail.com',
    }

    const app = await createTestingModule(defaultAuthDefinitionsFixture())

    const service = app.get(TokenService)

    correctRefreshToken = await lastValueFrom(
      service
        .generateTokenResponse(userInfo)
        .pipe(map((res) => res.refreshToken))
    )
  })

  it('should allow user to continue when accessToken is correct', async function () {
    const guard = new AuthRefreshTokenGuard()

    expect(
      await guard.canActivate(
        generateExecutionContextForRefreshTokenStrategy(correctRefreshToken)
      )
    ).toBeTruthy()
  })

  it('should not allow user to continue when accessToken is invalid', async function () {
    const guard = new AuthRefreshTokenGuard()

    try {
      await guard.canActivate(
        generateExecutionContextForRefreshTokenStrategy(
          'some-invalid-refresh-token'
        )
      )
    } catch (error) {
      expect(error).toBeInstanceOf(UnauthorizedException)
      expect(error.status).toEqual(HttpStatus.UNAUTHORIZED)
    }
  })
})
