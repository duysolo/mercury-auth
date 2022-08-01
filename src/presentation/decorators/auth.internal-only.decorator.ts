import { CustomDecorator, SetMetadata } from '@nestjs/common'
import { IS_INTERNAL_ONLY } from '../../domain'

export const InternalOnly: () => CustomDecorator = () =>
  SetMetadata(IS_INTERNAL_ONLY, true)
