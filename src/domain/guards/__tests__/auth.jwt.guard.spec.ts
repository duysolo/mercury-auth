import { HttpStatus, UnauthorizedException } from '@nestjs/common'
import { lastValueFrom, map } from 'rxjs'
import {
  createTestingModule,
  defaultAuthDefinitionsFixture,
} from '../../../__tests__/helpers'
import { IAuthUserEntityForResponse } from '../../definitions'
import { TokenService } from '../../services'
import { AuthJwtGuard } from '../auth.jwt.guard'
import { generateExecutionContextForJwtStrategy } from './helpers/test-guard.helper'

describe('AuthJwtGuard', () => {
  let correctAccessToken: string

  beforeAll(async () => {
    const userInfo: IAuthUserEntityForResponse = {
      id: '123456',
      username: 'sample-user@gmail.com',
    }

    const app = await createTestingModule(defaultAuthDefinitionsFixture())

    const service = app.get(TokenService)

    correctAccessToken = await lastValueFrom(
      service
        .generateTokenResponse(userInfo)
        .pipe(map((res) => res.accessToken))
    )
  })

  it('should allow user to continue when accessToken is correct', async function () {
    const guard = new AuthJwtGuard()

    expect(
      await guard.canActivate(
        generateExecutionContextForJwtStrategy(correctAccessToken)
      )
    ).toBeTruthy()
  })

  it('should not allow user to continue when accessToken is invalid', async function () {
    const guard = new AuthJwtGuard()

    try {
      await guard.canActivate(
        generateExecutionContextForJwtStrategy('some-invalid-access-token')
      )
    } catch (error) {
      expect(error).toBeInstanceOf(UnauthorizedException)
      expect(error.status).toEqual(HttpStatus.UNAUTHORIZED)
    }
  })
})
