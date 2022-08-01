import { Inject } from '@nestjs/common'
import { AUTH_DEFINITIONS_MODULE_OPTIONS } from '../../infrastructure'

export const InjectAuthDefinitions = () => {
  return Inject(AUTH_DEFINITIONS_MODULE_OPTIONS)
}
