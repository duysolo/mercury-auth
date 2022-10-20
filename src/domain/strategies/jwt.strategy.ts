import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, JwtFromRequestFunction, Strategy } from 'passport-jwt'
import {
  asyncScheduler,
  lastValueFrom,
  map,
  mergeMap,
  of,
  scheduled,
} from 'rxjs'
import { InjectAuthDefinitions } from '../decorators'
import type { IAuthUserEntityForResponse } from '../definitions'
import { AuthTransferTokenMethod } from '../definitions'
import { IJwtPayload, JwtPayload } from '../entities'
import {
  getRequestCookie,
  getRequestHeader,
  hideRedactedFields,
  IHttpRequest,
  validateEntity,
} from '../helpers'
import { IAuthDefinitions } from '../index'
import { AuthRepository } from '../repositories'
import { TokenService } from '../services'

export const JWT_STRATEGY_NAME: string = 'jwt'

const cookieExtractor: (
  transferTokenMethod: AuthTransferTokenMethod | undefined
) => JwtFromRequestFunction =
  (transferTokenMethod) =>
  (request: IHttpRequest): string | any => {
    if (transferTokenMethod === AuthTransferTokenMethod.BEARER_ONLY) {
      return null
    }

    return (
      (getRequestCookie(request, 'AccessToken') as unknown as string) || null
    )
  }

const accessTokenHeaderExtractor: (
  transferTokenMethod: AuthTransferTokenMethod | undefined
) => JwtFromRequestFunction =
  (transferTokenMethod) =>
  (request: IHttpRequest): string | any => {
    if (transferTokenMethod === AuthTransferTokenMethod.COOKIE_ONLY) {
      return null
    }

    const authHeader = getRequestHeader(request, 'authorization')

    if (!authHeader || typeof authHeader !== 'string') {
      return null
    }

    if (authHeader.toLowerCase().startsWith('bearer ')) {
      return authHeader.substring('bearer '.length)
    }

    return authHeader
  }

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, JWT_STRATEGY_NAME) {
  public constructor(
    @InjectAuthDefinitions()
    protected readonly authDefinitions: IAuthDefinitions,
    protected readonly authRepository: AuthRepository,
    protected readonly jwtService: TokenService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor(authDefinitions.transferTokenMethod),
        accessTokenHeaderExtractor(authDefinitions.transferTokenMethod),
      ]),
      ignoreExpiration: false,
      secretOrKey: authDefinitions.jwt?.secret || 'NOT_DEFINED',
    })
  }

  public async validate(
    payload: IJwtPayload
  ): Promise<IAuthUserEntityForResponse | undefined> {
    try {
      return lastValueFrom(
        scheduled(
          validateEntity(payload, JwtPayload, false),
          asyncScheduler
        ).pipe(
          map((res) => {
            return this.jwtService.decodeAccessTokenFromRawDecoded(res)
          }),
          mergeMap((validatedPayload) => {
            if (!validatedPayload?.username) {
              return of(undefined)
            }

            return this.authRepository
              .getAuthUserByUsername(validatedPayload.username)
              .pipe(
                map(hideRedactedFields(this.authDefinitions.redactedFields))
              )
          })
        )
      )
    } catch (error) {
      throw new UnauthorizedException()
    }
  }
}
