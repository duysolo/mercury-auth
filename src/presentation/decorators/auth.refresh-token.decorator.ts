import { CustomDecorator, SetMetadata } from '@nestjs/common'

export const IS_REFRESH_TOKEN_KEY: string = 'isRefreshToken'

export const ShouldUseRefreshToken: () => CustomDecorator = () =>
  SetMetadata(IS_REFRESH_TOKEN_KEY, true)
