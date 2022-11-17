import { TestingModule } from '@nestjs/testing/testing-module'
import {
  createTestingModule,
  defaultAuthDefinitionsFixture,
} from '../../../__tests__/helpers'
import { ProfileController } from '../profile.controller'

describe('ProfileController', () => {
  let controller: ProfileController

  let testModule: TestingModule

  const fixture = defaultAuthDefinitionsFixture()

  beforeAll(async () => {
    testModule = await createTestingModule(fixture)

    controller = testModule.get(ProfileController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
    expect(controller).toBeInstanceOf(ProfileController)
  })

  it('should able to show user profile', async function () {
    const currentUser = {
      id: 'sample-user-id',
      username: 'sample-user@gmail.com',
      email: 'sample-user@gmail.com',
    }

    const profile = controller.profile(currentUser)

    expect(profile).toMatchObject(currentUser)
  })
})
