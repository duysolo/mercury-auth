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

  const currentUserFixture = {
    id: 'sample-user-id',
    username: 'sample-user@gmail.com',
    email: 'sample-user@gmail.com',
  }

  beforeAll(async () => {
    testModule = await createTestingModule(fixture)

    controller = testModule.get(LoginController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
    expect(controller).toBeInstanceOf(LoginController)
  })

  it('the token service should be called', async () => {
    const spy = jest.spyOn(controller['_tokenService'], 'generateTokenResponse')

    await lastValueFrom(
      controller.handle(currentUserFixture).pipe(
        tap(() => {
          expect(spy).toHaveBeenCalledWith(currentUserFixture)
        })
      )
    )
  })

  it('should able to show token response', async function () {
    await lastValueFrom(
      controller.handle(currentUserFixture).pipe(
        tap((res) => {
          expect(res.userData).toMatchObject(currentUserFixture)

          expect(res.token?.accessToken).toBeDefined()
          expect(res.token?.refreshToken).toBeDefined()
          expect(res.token?.expiryDate).toBeDefined()
        })
      )
    )
  })
})
