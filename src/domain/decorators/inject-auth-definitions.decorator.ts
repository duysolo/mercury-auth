import { Inject } from '@nestjs/common'
import { AUTH_DEFINITIONS_MODULE_OPTIONS } from '../../infrastructure/auth-definitions.module'

export const InjectAuthDefinitions = () => {
  return Inject(AUTH_DEFINITIONS_MODULE_OPTIONS)
}
