import { TestingModule } from '@nestjs/testing/testing-module'
import {
  createTestingModule,
  defaultAuthDefinitionsFixture,
} from '../../../__tests__/helpers'
import { ApiKeyController } from '../api-key.controller'

describe('ApiKeyController', () => {
  let controller: ApiKeyController

  let testModule: TestingModule

  const fixture = defaultAuthDefinitionsFixture()

  beforeAll(async () => {
    testModule = await createTestingModule(fixture)

    controller = testModule.get(ApiKeyController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
    expect(controller).toBeInstanceOf(ApiKeyController)
  })

  it('should able to show user profile', async function () {
    const currentUser = {
      id: 'sample-user-id',
      username: 'sample-user@gmail.com',
      email: 'sample-user@gmail.com',
    }

    const profile = controller.profileByApiKey(currentUser)

    expect(profile).toMatchObject(currentUser)
  })
})
