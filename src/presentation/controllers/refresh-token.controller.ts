import { Controller, Post, UseInterceptors } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { Observable } from 'rxjs'
import {
  AuthenticationService,
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
    private readonly _mercuryJwtService: AuthenticationService
  ) {}

  @ApiOperation({
    summary: 'Regenerate access token',
  })
  @Post('refresh-token')
  public index(
    @CurrentUser() user: IAuthUserEntityForResponse
  ): Observable<IJwtTokenResponse> {
    return this._mercuryJwtService.generateTokenResponse(user)
  }
}
