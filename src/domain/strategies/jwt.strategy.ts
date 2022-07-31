import { Inject, Injectable, UnauthorizedException } from '@nestjs/common'
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
import {
  AUTH_DEFINITIONS_MODULE_OPTIONS,
  IAuthDefinitions,
} from '../../auth-definitions.module'
import { IAuthUserEntityForResponse } from '../definitions'
import { IJwtPayload, JwtPayload } from '../entities'
import {
  getRequestCookie,
  getRequestHeader,
  hideRedactedFields,
  IHttpRequest,
  validateEntity,
} from '../helpers'
import { AuthRepository } from '../repositories'
import { AuthenticationService } from '../services'

export const JWT_STRATEGY_NAME: string = 'jwt'

const cookieExtractor: JwtFromRequestFunction = (
  request: IHttpRequest
): string | null => {
  return (getRequestCookie(request, 'AccessToken') as unknown as string) || null
}

const accessTokenHeaderExtractor: JwtFromRequestFunction = (
  request: IHttpRequest
): string | undefined | any => {
  const authHeader = getRequestHeader(request, 'authorization')

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
        scheduled(validateEntity(payload, JwtPayload), asyncScheduler).pipe(
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
