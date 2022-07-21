import { CustomDecorator, SetMetadata } from '@nestjs/common'

export const IS_INTERNAL_ONLY: string = 'isInternalOnly'

export const InternalOnly: () => CustomDecorator<string> = () =>
  SetMetadata(IS_INTERNAL_ONLY, true)
