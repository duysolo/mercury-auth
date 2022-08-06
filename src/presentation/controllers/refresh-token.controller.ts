import { Controller, Post, UseInterceptors } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { map, Observable } from 'rxjs'
import {
  TokenService,
  IAuthUserEntityForResponse,
  IJwtTokenResponse,
} from '../../domain'
import { CurrentUser, ShouldUseRefreshToken } from '../decorators'
import { CookieAuthInterceptor } from '../interceptors'

@ApiTags('Authentication')
@Controller({ path: 'auth' })
@ShouldUseRefreshToken()
@UseInterceptors(CookieAuthInterceptor)
export class RefreshTokenController {
  public constructor(
    private readonly _mercuryJwtService: TokenService
  ) {
  }

  @ApiOperation({
    summary: 'Regenerate access token',
  })
  @Post('refresh-token')
  public index(@CurrentUser() user: IAuthUserEntityForResponse): Observable<{
    user: IAuthUserEntityForResponse
    token: IJwtTokenResponse
  }> {
    return this._mercuryJwtService
      .generateTokenResponse(user)
      .pipe(map((res) => ({ user, token: res })))
  }
}
