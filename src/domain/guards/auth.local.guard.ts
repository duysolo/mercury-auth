import { Injectable } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { LOCAL_STRATEGY_NAME } from '../strategies'

@Injectable()
export class AuthLocalGuard extends AuthGuard(LOCAL_STRATEGY_NAME) {}
