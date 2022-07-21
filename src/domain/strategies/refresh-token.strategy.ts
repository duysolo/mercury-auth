import { HttpStatus, Inject, Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { FastifyRequest } from 'fastify'
import { ExtractJwt, JwtFromRequestFunction } from 'passport-jwt'
import { Strategy } from 'passport-strategy'
import { lastValueFrom, map } from 'rxjs'
import { hideRedactedFields, IAuthUserEntityForResponse, IJwtPayload } from '..'
import {
  AUTH_DEFINITIONS_MODULE_OPTIONS,
  IAuthDefinitions,
} from '../../infrastructure'
import { AuthRepository } from '../repositories'
import { AuthenticationService } from '../services'

export const REFRESH_TOKEN_STRATEGY_NAME: string = 'mercury-refresh-token'

const cookieExtractor: JwtFromRequestFunction = (
  request: FastifyRequest | any
): string | undefined | any => {
  return request?.cookies?.RefreshToken
}

const refreshTokenHeaderExtractor: JwtFromRequestFunction = (
  request: FastifyRequest | any
): string | undefined | any => {
  return request.headers['refresh-token'] as unknown as string
}

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  REFRESH_TOKEN_STRATEGY_NAME
) {
  protected jwtFromRequest: JwtFromRequestFunction = ExtractJwt.fromExtractors([
    cookieExtractor,
    refreshTokenHeaderExtractor,
  ]) as any

  public constructor(
    @Inject(AUTH_DEFINITIONS_MODULE_OPTIONS)
    protected readonly authDefinitions: IAuthDefinitions,
    protected readonly authRepository: AuthRepository,
    protected readonly jwtService: AuthenticationService
  ) {
    super()
  }

  public async authenticate(req: any, options?: any): Promise<void> {
    const token: string | any = this.jwtFromRequest(req)

    const jwtPayload = token
      ? this.jwtService.decodeRefreshToken(token)
      : undefined

    const user = jwtPayload ? await this.validate(jwtPayload) : undefined

    if (!jwtPayload || !user) {
      this.fail(HttpStatus.UNAUTHORIZED)
    } else {
      this.success(user)
    }
  }

  protected async validate(
    payload: IJwtPayload
  ): Promise<IAuthUserEntityForResponse> {
    return lastValueFrom(
      this.authRepository
        .getAuthUserByUsername(payload.username)
        .pipe(map(hideRedactedFields(this.authDefinitions.redactedFields)))
    )
  }
}
