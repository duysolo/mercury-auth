import { Controller, Get } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { IAuthUserEntityForResponse } from '../../domain'
import { CurrentUser } from '../decorators'

@ApiTags('Authentication')
@Controller({ path: 'auth' })
export class ProfileController {
  @ApiOperation({
    summary: 'Get profile',
  })
  @Get('profile')
  public profile(
    @CurrentUser() user: IAuthUserEntityForResponse
  ): IAuthUserEntityForResponse {
    return user
  }
}
