import { TestingModule } from '@nestjs/testing/testing-module'
import { lastValueFrom, tap } from 'rxjs'
import {
  createTestingModule,
  defaultAuthDefinitionsFixture,
} from '../../../__tests__/helpers'
import { RefreshTokenController } from '../refresh-token.controller'

describe('RefreshTokenController', () => {
  let controller: RefreshTokenController

  let testModule: TestingModule

  const fixture = defaultAuthDefinitionsFixture()

  const currentUserFixture = {
    id: 'sample-user-id',
    username: 'sample-user@gmail.com',
    email: 'sample-user@gmail.com',
  }

  beforeAll(async () => {
    testModule = await createTestingModule(fixture)

    controller = testModule.get(RefreshTokenController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
    expect(controller).toBeInstanceOf(RefreshTokenController)
  })

  it('should able to show token response', async function () {
    await lastValueFrom(
      controller
        .index({
          userData: currentUserFixture,
          token: {
            accessToken: 'some-access-token',
            refreshToken: 'some-refresh-token',
            expiryDate: new Date(),
            refreshTokenExpiryDate: new Date(),
          },
        })
        .pipe(
          tap((res) => {
            expect(res.userData).toMatchObject(currentUserFixture)

            expect(res.token?.accessToken).toBeDefined()
            expect(res.token?.['refreshToken']).toBeUndefined()
            expect(res.token?.expiryDate).toBeDefined()
            expect(res.token?.['refreshTokenExpiryDate']).toBeUndefined()
          })
        )
    )
  })
})
