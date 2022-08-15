import { Controller, Post, UseInterceptors } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import _ from 'lodash/fp'
import { map, Observable } from 'rxjs'
import {
  IAuthUserEntityForResponse,
  IRefreshTokenAuthResponse,
  TokenService,
} from '../../domain'
import { CurrentUser, ShouldUseRefreshToken } from '../decorators'
import { CookieAuthInterceptor } from '../interceptors'

@ApiTags('Authentication')
@Controller({ path: 'auth' })
@ShouldUseRefreshToken()
@UseInterceptors(CookieAuthInterceptor)
export class RefreshTokenController {
  public constructor(private readonly _tokenService: TokenService) {}

  @ApiOperation({
    summary: 'Regenerate access token',
  })
  @Post('refresh-token')
  public handle(
    @CurrentUser() user: IAuthUserEntityForResponse
  ): Observable<IRefreshTokenAuthResponse> {
    return this._tokenService
      .generateTokenResponse(user)
      .pipe(map((res) => ({ user, token: _.omit(['refreshToken'], res) })))
  }
}
