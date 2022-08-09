import { TestingModule } from '@nestjs/testing/testing-module'
import { lastValueFrom, tap } from 'rxjs'
import {
  createTestingModule,
  defaultAuthDefinitionsFixture,
} from '../../../__tests__/helpers'
import { LoginController } from '../login.controller'

describe('LoginController', () => {
  let controller: LoginController

  let testModule: TestingModule

  const fixture = defaultAuthDefinitionsFixture()

  beforeAll(async () => {
    testModule = await createTestingModule(fixture)

    controller = testModule.get(LoginController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
    expect(controller).toBeInstanceOf(LoginController)
  })

  it('should able to show token response', async function () {
    const currentUser = {
      id: 'sample-user-id',
      username: 'sample-user@gmail.com',
      email: 'sample-user@gmail.com',
    }
    await lastValueFrom(
      controller.handle(currentUser).pipe(
        tap((res) => {
          expect(res.user).toMatchObject(currentUser)

          expect(res.token?.accessToken).toBeDefined()
          expect(res.token?.refreshToken).toBeDefined()
          expect(res.token?.expiryDate).toBeDefined()
        })
      )
    )
  })
})
