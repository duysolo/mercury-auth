import { InjectAuthDefinitions } from '../'

describe('InjectAuthDefinitions', () => {
  it('should wrap the @Inject decorator with the auth definitions token', () => {
    const result = InjectAuthDefinitions()
    expect(result.name).toBeDefined()
  })
})
