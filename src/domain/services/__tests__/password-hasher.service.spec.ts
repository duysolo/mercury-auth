import { BcryptPasswordHasherService } from '../password-hasher.service'

describe('BcryptPasswordHasherService', () => {
  const service = new BcryptPasswordHasherService()

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
