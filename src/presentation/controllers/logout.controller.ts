import { Controller, Post, UseInterceptors } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { UserLogoutInterceptor } from '../interceptors'

@ApiTags('Authentication')
@Controller({ path: 'auth' })
@UseInterceptors(UserLogoutInterceptor)
export class LogoutController {
  @ApiOperation({
    summary: 'Logout',
  })
  @Post('logout')
  public handle(): void {}
}
