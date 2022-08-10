import { IS_INTERNAL_ONLY } from '../../../domain'
import { InternalOnly } from '../auth.internal-only.decorator'
import { metadataDecoratorTestHelper } from './helpers/metadata-decorator.test.helper'

metadataDecoratorTestHelper(
  'InternalOnly decorator',
  InternalOnly,
  IS_INTERNAL_ONLY,
  true
)
