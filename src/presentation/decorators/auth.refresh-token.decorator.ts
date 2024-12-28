import { CustomDecorator, SetMetadata } from '@nestjs/common'
import { IS_REFRESH_TOKEN_KEY } from '../../domain'

export const AuthRefreshToken: () => CustomDecorator = () =>
  SetMetadata(IS_REFRESH_TOKEN_KEY, true)
