import { CustomDecorator, SetMetadata } from '@nestjs/common'
import { IS_API_KEY } from '../../domain'

export const AuthApiKey: () => CustomDecorator = () =>
  SetMetadata(IS_API_KEY, true)
