import { IS_API_KEY } from '../../../domain'
import { AuthApiKey } from '../auth.api-key.decorator'
import { metadataDecoratorTestHelper } from './helpers/metadata-decorator.test.helper'

metadataDecoratorTestHelper(
  'ShouldUseApiKey',
  AuthApiKey,
  IS_API_KEY,
  true
)
