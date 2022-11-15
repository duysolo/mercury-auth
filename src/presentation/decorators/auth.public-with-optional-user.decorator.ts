import { CustomDecorator, SetMetadata } from '@nestjs/common'
import { IS_PUBLIC_WITH_OPTIONAL_USER_KEY } from '../../domain'

export const PublicWithOptionalUser: () => CustomDecorator = () =>
  SetMetadata(IS_PUBLIC_WITH_OPTIONAL_USER_KEY, true)
