import { Controller, Post, UseGuards, UseInterceptors } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { map, Observable } from 'rxjs'
import {
  AuthLocalGuard,
  IAuthResponse,
  IAuthUserEntityForResponse,
  TokenService,
} from '../../domain'
import { CurrentUser, Public } from '../decorators'
import { CookieAuthInterceptor } from '../interceptors'

@ApiTags('Authentication')
@Public()
@Controller({ path: 'auth' })
@UseGuards(AuthLocalGuard)
@UseInterceptors(CookieAuthInterceptor)
export class LoginController {
  public constructor(private readonly _authenticationService: TokenService) {}

  @ApiOperation({
    summary: 'Login',
  })
  @Post('login')
  public handle(
    @CurrentUser() user: IAuthUserEntityForResponse
  ): Observable<IAuthResponse> {
    return this._authenticationService
      .generateTokenResponse(user)
      .pipe(map((res) => ({ user, token: res })))
  }
}
