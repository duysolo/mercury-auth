import { Controller, Post, UseGuards, UseInterceptors } from '@nestjs/common'
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger'
import { map, Observable } from 'rxjs'
import {
  AuthDto,
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
  public constructor(private readonly _tokenService: TokenService) {}

  @ApiOperation({
    summary: 'Login',
  })
  @ApiBody({ type: AuthDto })
  @Post('login')
  public handle(
    @CurrentUser() userData: IAuthUserEntityForResponse
  ): Observable<IAuthResponse> {
    return this._tokenService
      .generateTokenResponse(userData)
      .pipe(map((res) => ({ userData, token: res })))
  }
}
