import { IAuthUserEntity, IAuthUserEntityForResponse } from '../index'

export function hideRedactedFields(
  redactedFields?: string[]
): (user: IAuthUserEntity) => IAuthUserEntityForResponse {
  return (user) => {
    const omittedFields = redactedFields || ['password']

    return Object.fromEntries(
      Object.entries(user).filter(([key]) => !omittedFields.includes(key))
    )
  }
}
