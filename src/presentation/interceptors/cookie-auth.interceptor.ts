import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common'
import type { FastifyReply } from 'fastify'
import moment from 'moment'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { AuthTransferTokenMethod, IJwtTokenResponse } from '../../domain'
import {
  AUTH_DEFINITIONS_MODULE_OPTIONS,
  IAuthDefinitions,
} from '../../infrastructure'

const transferFromResponseToCookie: (
  response: FastifyReply,
  authPrefer: AuthTransferTokenMethod
) => (
  token: IJwtTokenResponse,
  mapKeys: {
    [responseKey: string]: string
  }
) => Record<string, any> = (response, authPrefer) => (token, mapKeys) => {
  if (
    !response.setCookie ||
    ![
      AuthTransferTokenMethod.COOKIE_ONLY,
      AuthTransferTokenMethod.BOTH,
    ].includes(authPrefer)
  ) {
    return token
  }

  // eslint-disable-next-line guard-for-in
  for (const responseKey in mapKeys) {
    if (token[responseKey]) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      response.setCookie(mapKeys[responseKey], token[responseKey], {
        httpOnly: true,
        expires: moment(token.expiryDate).toDate(),
        path: '/',
        sameSite: 'none',
        secure: process.env.NODE_ENV !== 'local',
      })

      if (authPrefer === AuthTransferTokenMethod.COOKIE_ONLY) {
        delete token[responseKey]
      }
    }
  }

  return token
}

@Injectable()
export class CookieAuthInterceptor implements NestInterceptor {
  public constructor(
    @Inject(AUTH_DEFINITIONS_MODULE_OPTIONS)
    protected readonly definitions: IAuthDefinitions
  ) {}

  public intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Observable<any> {
    const res = context.switchToHttp().getResponse()

    return next.handle().pipe(
      map((tokenResponse: IJwtTokenResponse) => {
        if (
          !res.setCookie ||
          this.definitions.transferTokenMethod ===
            AuthTransferTokenMethod.BEARER_ONLY ||
          !tokenResponse.accessToken
        ) {
          return tokenResponse
        }

        const transferFunction = transferFromResponseToCookie(
          res,
          this.definitions.transferTokenMethod
        )

        return transferFunction(tokenResponse, {
          accessToken: 'AccessToken',
          refreshToken: 'RefreshToken',
        })
      })
    )
  }
}
