import { Inject } from '@nestjs/common'
import { AUTH_PASSWORD_HASHER } from '../services'

export const InjectPasswordHasher = () => {
  return Inject(AUTH_PASSWORD_HASHER)
}
