import { Inject } from '@nestjs/common'
import { AUTH_DEFINITIONS_MODULE_OPTIONS } from '../../infrastructure/auth-definitions.module'

export const InjectAuthDefinitions: () => ReturnType<typeof Inject> = () => {
  return Inject(AUTH_DEFINITIONS_MODULE_OPTIONS)
}
