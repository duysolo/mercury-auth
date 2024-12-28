import { Controller, Post, UseInterceptors } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { Observable, of } from 'rxjs'
import { IAuthWithTokenResponse, IRefreshTokenAuthResponse } from '../../domain'
import { CurrentUserWithToken, AuthRefreshToken } from '../decorators'
import { CookieAuthInterceptor } from '../interceptors'

@ApiTags('Authentication')
@Controller({ path: 'auth' })
@AuthRefreshToken()
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

    const omittedFields = ['refreshToken', 'refreshTokenExpiryDate']

    return of({
      userData,
      token: Object.fromEntries(
        Object.entries(token).filter(([key]) => !omittedFields.includes(key))
      ) as IRefreshTokenAuthResponse['token'],
    })
  }
}
