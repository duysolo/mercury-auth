import { Controller, Post, UseGuards, UseInterceptors } from '@nestjs/common'
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Observable, of } from 'rxjs'
import { AuthDto, AuthLocalGuard, IAuthWithTokenResponse } from '../../domain'
import { CurrentUserWithToken, Public } from '../decorators'
import { CookieAuthInterceptor } from '../interceptors'

@ApiTags('Authentication')
@Public()
@Controller({ path: 'auth' })
@UseGuards(AuthLocalGuard)
@UseInterceptors(CookieAuthInterceptor)
export class LoginController {
  @ApiOperation({
    summary: 'Login',
  })
  @ApiBody({ type: AuthDto })
  @Post('login')
  public handle(
    @CurrentUserWithToken() userData: IAuthWithTokenResponse
  ): Observable<IAuthWithTokenResponse> {
    return of(userData)
  }
}
