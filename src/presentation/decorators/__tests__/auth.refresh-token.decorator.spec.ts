import { IS_REFRESH_TOKEN_KEY } from '../../../domain'
import { AuthRefreshToken } from '../auth.refresh-token.decorator'
import { metadataDecoratorTestHelper } from './helpers/metadata-decorator.test.helper'

metadataDecoratorTestHelper(
  'ShouldUseRefreshToken',
  AuthRefreshToken,
  IS_REFRESH_TOKEN_KEY,
  true
)
