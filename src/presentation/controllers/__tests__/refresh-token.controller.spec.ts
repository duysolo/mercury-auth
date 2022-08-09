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

  beforeAll(async () => {
    testModule = await createTestingModule(fixture)

    controller = testModule.get(RefreshTokenController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
    expect(controller).toBeInstanceOf(RefreshTokenController)
  })

  it('should able to show token response', async function () {
    const currentUser = {
      id: 'sample-user-id',
      username: 'sample-user@gmail.com',
      email: 'sample-user@gmail.com',
    }
    await lastValueFrom(
      controller.index(currentUser).pipe(
        tap((res) => {
          expect(res.user).toMatchObject(currentUser)

          expect(res.token?.accessToken).toBeDefined()
          expect(res.token?.['refreshToken']).toBeUndefined()
          expect(res.token?.expiryDate).toBeDefined()
        })
      )
    )
  })
})
