import _ from 'lodash/fp'
import { IAuthUserEntity, IAuthUserEntityForResponse } from '..'

export function hideRedactedFields(
  redactedFields?: string[]
): (user: IAuthUserEntity) => IAuthUserEntityForResponse {
  return (user) =>
    _.omit(
      redactedFields || ['password'],
      user
    ) as unknown as IAuthUserEntityForResponse
}
