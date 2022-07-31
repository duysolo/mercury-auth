import { Controller, Post, UseGuards, UseInterceptors } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { Observable } from 'rxjs'
import {
  AuthenticationService,
  AuthLocalGuard,
  IAuthUserEntityForResponse,
  IJwtTokenResponse,
} from '../../domain'
import { CurrentUser, Public } from '../decorators'
import { CookieAuthInterceptor } from '../interceptors'

@ApiTags('Authentication')
@Public()
@Controller({ path: 'auth' })
@UseGuards(AuthLocalGuard)
@UseInterceptors(CookieAuthInterceptor)
export class LoginController {
  public constructor(
    private readonly _authenticationService: AuthenticationService
  ) {
  }

  @ApiOperation({
    summary: 'Login',
  })
  @Post('login')
  public handle(
    @CurrentUser() user: IAuthUserEntityForResponse
  ): Observable<IJwtTokenResponse> {
    return this._authenticationService.generateTokenResponse(user)
  }
}
