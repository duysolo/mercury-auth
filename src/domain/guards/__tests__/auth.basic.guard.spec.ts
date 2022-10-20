import { HttpStatus, UnauthorizedException } from '@nestjs/common'
import { defaultAuthDefinitionsFixture } from '../../../__tests__/helpers'
import { AuthBasicGuard } from '../auth.basic.guard'
import { generateExecutionContextForBasicAuth } from './helpers/test-guard.helper'

describe('AuthBasicGuard', () => {
  it('should allow user to continue when basic auth info is correct', async function () {
    const fixture = defaultAuthDefinitionsFixture()

    const guard = new AuthBasicGuard(fixture)

    expect(
      guard.canActivate(
        generateExecutionContextForBasicAuth(
          fixture.basicAuth?.username as string,
          fixture.basicAuth?.password as string
        )
      )
    ).toBeTruthy()
  })

  it('should not allow user to continue when basic auth info is invalid', async function () {
    const guard = new AuthBasicGuard(defaultAuthDefinitionsFixture())

    try {
      guard.canActivate(
        generateExecutionContextForBasicAuth(
          'invalid-username',
          'invalid-password'
        )
      )
    } catch (error) {
      expect(error).toBeInstanceOf(UnauthorizedException)
      expect(error.status).toEqual(HttpStatus.UNAUTHORIZED)
    }
  })
})
