import { Injectable } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { API_KEY_STRATEGY_NAME } from '../strategies'

@Injectable()
export class AuthApiKeyGuard extends AuthGuard(
  API_KEY_STRATEGY_NAME
) {}
