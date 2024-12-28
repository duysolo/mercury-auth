import { Controller, Get } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { IAuthUserEntityForResponse } from '../../domain'
import { AuthApiKey, CurrentUser } from '../decorators'

@ApiTags('Authentication')
@Controller({ path: 'auth' })
export class ApiKeyController {
  @ApiOperation({
    summary: 'Get profile by API Key',
  })
  @AuthApiKey()
  @Get('profile/api-key')
  public profileByApiKey(
    @CurrentUser() user: IAuthUserEntityForResponse
  ): IAuthUserEntityForResponse {
    return user || null
  }
}
