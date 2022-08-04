import {
  createTestingModule,
  defaultAuthDefinitionsFixture,
} from '../../../__tests__/helpers'
import {
  AUTH_PASSWORD_HASHER,
  PasswordHasherService,
} from '../password-hasher.service'

describe('BcryptPasswordHasherService', () => {
  let service: PasswordHasherService

  beforeAll(async () => {
    const app = await createTestingModule(defaultAuthDefinitionsFixture())

    service = app.get(AUTH_PASSWORD_HASHER)
  })

  it('should able to hash the password', async () => {
    const hashedPassword = await service.hash('sample-password')

    expect(hashedPassword).toBeDefined()
  })

  it('should able to compare the hashed password with the given password', async () => {
    const hashedPassword = await service.hash('sample-password')

    expect(
      await service.compare('sample-password', hashedPassword)
    ).toBeTruthy()
    expect(
      await service.compare('invalid-password', hashedPassword)
    ).toBeFalsy()
  })
})
