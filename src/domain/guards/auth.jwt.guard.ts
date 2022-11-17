import { Injectable } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { JWT_STRATEGY_NAME } from '../strategies'

@Injectable()
export class AuthJwtGuard extends AuthGuard(JWT_STRATEGY_NAME) {}
