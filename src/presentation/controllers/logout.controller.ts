import { Controller, Post, UseInterceptors } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { ClearAuthCookieInterceptor } from '../interceptors'

@ApiTags('Authentication')
@Controller({ path: 'auth' })
@UseInterceptors(ClearAuthCookieInterceptor)
export class LogoutController {
  @ApiOperation({
    summary: 'Logout',
  })
  @Post('logout')
  public handle(): void {
  }
}
