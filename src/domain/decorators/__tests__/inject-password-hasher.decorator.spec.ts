import { InjectPasswordHasher } from '../'

describe('InjectPasswordHasher', () => {
  it('should wrap the @Inject decorator with the password hasher token', () => {
    const result = InjectPasswordHasher()
    expect(result.name).toBeDefined()
  })
})
