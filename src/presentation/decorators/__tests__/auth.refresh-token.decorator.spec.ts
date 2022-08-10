import { IS_REFRESH_TOKEN_KEY } from '../../../domain'
import { ShouldUseRefreshToken } from '../auth.refresh-token.decorator'
import { metadataDecoratorTestHelper } from './helpers/metadata-decorator.test.helper'

metadataDecoratorTestHelper(
  'ShouldUseRefreshToken decorator',
  ShouldUseRefreshToken,
  IS_REFRESH_TOKEN_KEY,
  true
)
