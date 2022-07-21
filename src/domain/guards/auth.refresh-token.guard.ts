import { Injectable } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { REFRESH_TOKEN_STRATEGY_NAME } from '../strategies'

@Injectable()
export class AuthRefreshTokenGuard extends AuthGuard(
  REFRESH_TOKEN_STRATEGY_NAME
) {}
