import { IS_PUBLIC_KEY } from '../../../domain'
import { Public } from '../auth.public.decorator'
import { metadataDecoratorTestHelper } from './helpers/metadata-decorator.test.helper'

metadataDecoratorTestHelper('Public decorator', Public, IS_PUBLIC_KEY, true)
