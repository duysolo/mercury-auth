import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common'
import moment from 'moment'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import {
  AuthTransferTokenMethod,
  CookieSerializeOptions,
  getResponseFromContext,
  IHttpResponse,
  IJwtTokenResponse,
} from '../../domain'
import {
  AUTH_DEFINITIONS_MODULE_OPTIONS,
  IAuthDefinitions,
} from '../../auth-definitions.module'

const transferFromResponseToCookie: (
  response: IHttpResponse,
  definitions: IAuthDefinitions
) => (
  token: IJwtTokenResponse,
  mapKeys: {
    [responseKey: string]: string
  }
) => Record<string, any> = (response, definitions) => (token, mapKeys) => {
  if (
    (response.httpAdaptorType === 'fastify' && !response.setCookie) ||
    (response.httpAdaptorType === 'express' && !response.cookie) ||
    ![
      AuthTransferTokenMethod.COOKIE_ONLY,
      AuthTransferTokenMethod.BOTH,
    ].includes(definitions.transferTokenMethod)
  ) {
    return token
  }

  // eslint-disable-next-line guard-for-in
  for (const responseKey in mapKeys) {
    if (token[responseKey]) {
      const cookieOptions: CookieSerializeOptions = {
        httpOnly: true,
        expires: moment(token.expiryDate).toDate(),
        path: '/',
        sameSite: 'none',
        secure: process.env.NODE_ENV !== 'local',
      }

      if (response.httpAdaptorType === 'fastify' && response.setCookie) {
        response.setCookie(
          mapKeys[responseKey],
          token[responseKey],
          cookieOptions
        )
      }

      if (response.httpAdaptorType === 'express' && response.cookie) {
        response.cookie(mapKeys[responseKey], token[responseKey], cookieOptions)
      }

      if (
        definitions.transferTokenMethod === AuthTransferTokenMethod.COOKIE_ONLY
      ) {
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
    const res = getResponseFromContext(context)

    res.httpAdaptorType = this.definitions.httpAdaptorType

    return next.handle().pipe(
      map((tokenResponse: IJwtTokenResponse) => {
        if (
          (res.httpAdaptorType === 'fastify' && !res.setCookie) ||
          (res.httpAdaptorType === 'express' && !res.cookie) ||
          this.definitions.transferTokenMethod ===
            AuthTransferTokenMethod.BEARER_ONLY ||
          !tokenResponse.accessToken
        ) {
          return tokenResponse
        }

        const transferFunction = transferFromResponseToCookie(
          res,
          this.definitions
        )

        return transferFunction(tokenResponse, {
          accessToken: 'AccessToken',
          refreshToken: 'RefreshToken',
        })
      })
    )
  }
}
