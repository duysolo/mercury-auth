import { Inject } from '@nestjs/common'
import { AUTH_PASSWORD_HASHER } from '../services/password-hasher.service'

export const InjectPasswordHasher = () => {
  return Inject(AUTH_PASSWORD_HASHER)
}
