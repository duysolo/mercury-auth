import { IAuthUserEntity } from '../../definitions'
import { hideRedactedFields } from '../hide-redacted-fields.helper'

describe('hideRedactedFields helper', () => {
  const fixture: IAuthUserEntity = {
    id: 'some-user-id',
    username: 'some-user-name',
    password: 'some-password-phrase',
  }

  it('should not able to access redacted fields', () => {
    const userWithoutPassword = hideRedactedFields(['password'])(fixture)

    expect(userWithoutPassword.password).toBeUndefined()
  })

  it('should able to access non-redacted fields', () => {
    const userWithoutPassword = hideRedactedFields(['password'])(fixture)

    expect(userWithoutPassword.username).toEqual(fixture.username)
  })

  it('should ignore non-blacklisted fields', () => {
    const userWithoutPassword = hideRedactedFields(['notExistedField'])(fixture)

    expect(userWithoutPassword).toEqual(fixture)
  })
})
