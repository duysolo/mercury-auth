import { TestingModule } from '@nestjs/testing/testing-module'
import {
  createTestingModule,
  defaultAuthDefinitionsFixture,
} from '../../../__tests__/helpers'
import { LogoutController } from '../logout.controller'

describe('LogoutController', () => {
  let controller

  const fixture = defaultAuthDefinitionsFixture()

  beforeAll(async () => {
    const testModule: TestingModule = await createTestingModule(fixture)

    controller = testModule.get(LogoutController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
    expect(controller).toBeInstanceOf(LogoutController)
  })

  it('should able to logout', async function () {
    const profile = controller.handle()

    expect(profile).toBeUndefined()
  })
})
