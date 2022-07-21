import { Inject, Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { FastifyRequest } from 'fastify'
import { ExtractJwt, JwtFromRequestFunction, Strategy } from 'passport-jwt'
import { lastValueFrom, map, mergeMap, of } from 'rxjs'
import {
  AUTH_DEFINITIONS_MODULE_OPTIONS,
  IAuthDefinitions,
} from '../../infrastructure'
import { IAuthUserEntityForResponse } from '../definitions'
import { IJwtPayload, JwtPayload } from '../entities'
import { hideRedactedFields, validateEntity } from '../helpers'
import { AuthRepository } from '../repositories'
import { AuthenticationService } from '../services'

export const JWT_STRATEGY_NAME: string = 'jwt'

const cookieExtractor: JwtFromRequestFunction = (
  request: FastifyRequest | any
): string | undefined | any => {
  return request?.cookies?.AccessToken || null
}

const accessTokenHeaderExtractor: JwtFromRequestFunction = (
  request: FastifyRequest | any
): string | undefined | any => {
  const authHeader = request.headers.authorization

  if (!authHeader || typeof authHeader !== 'string') {
    return undefined
  }

  if (authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.substring('bearer '.length)
  }

  return authHeader
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, JWT_STRATEGY_NAME) {
  public constructor(
    @Inject(AUTH_DEFINITIONS_MODULE_OPTIONS)
    protected readonly authDefinitions: IAuthDefinitions,
    protected readonly authRepository: AuthRepository,
    protected readonly jwtService: AuthenticationService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor,
        accessTokenHeaderExtractor,
      ]),
      ignoreExpiration: false,
      secretOrKey: authDefinitions.jwt.secret,
    })
  }

  public async validate(
    payload: IJwtPayload
  ): Promise<IAuthUserEntityForResponse | undefined> {
    try {
      return lastValueFrom(
        validateEntity(payload, JwtPayload).pipe(
          map((res) => this.jwtService.decodeAccessTokenFromRawDecoded(res)),
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
