import { Controller, Post, UseInterceptors } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import _ from 'lodash/fp'
import { Observable, of } from 'rxjs'
import { IAuthWithTokenResponse, IRefreshTokenAuthResponse } from '../../domain'
import { CurrentUserWithToken, ShouldUseRefreshToken } from '../decorators'
import { CookieAuthInterceptor } from '../interceptors'

@ApiTags('Authentication')
@Controller({ path: 'auth' })
@ShouldUseRefreshToken()
@UseInterceptors(CookieAuthInterceptor)
export class RefreshTokenController {
  @ApiOperation({
    summary: 'Regenerate access token',
  })
  @Post('refresh-token')
  public index(
    @CurrentUserWithToken() user: IAuthWithTokenResponse
  ): Observable<IRefreshTokenAuthResponse> {
    const { userData, token } = user

    return of({
      userData,
      token: _.omit(['refreshToken'], token),
    })
  }
}
