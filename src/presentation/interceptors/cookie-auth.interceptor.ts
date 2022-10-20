import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common'
import { map, Observable } from 'rxjs'
import {
  AuthTransferTokenMethod,
  getResponseFromContext,
  IAuthDefinitions,
  IAuthResponse,
  ICookieSerializeOptions,
  IHttpResponse,
  IJwtTokenResponse,
  InjectAuthDefinitions,
} from '../../domain'

type IMapKeys<T> = Partial<{
  [responseKey in keyof T]: string
}>

const transferFromResponseToCookie: (
  response: IHttpResponse,
  definitions: IAuthDefinitions
) => (
  authResponse: IAuthResponse,
  mapKeys: IMapKeys<IJwtTokenResponse>
) => Record<string, any> =
  (response, definitions) => (authResponse, mapKeys) => {
    if (
      (response.httpAdaptorType === 'fastify' && !response.setCookie) ||
      (response.httpAdaptorType === 'express' && !response.cookie) ||
      !definitions.transferTokenMethod ||
      ![
        AuthTransferTokenMethod.COOKIE_ONLY,
        AuthTransferTokenMethod.BOTH,
      ].includes(definitions.transferTokenMethod)
    ) {
      return authResponse
    }

    const token: IJwtTokenResponse = authResponse.token

    for (const responseKey in mapKeys) {
      if (token[responseKey]) {
        const cookieOptions: ICookieSerializeOptions = {
          path: '/',
          httpOnly: true,
          sameSite: 'none',
          secure: process.env.NODE_ENV !== 'local',
          ...definitions.cookieOptions,

          expires: token.expiryDate,
        }

        if (response.httpAdaptorType === 'fastify' && response.setCookie) {
          response.setCookie(
            mapKeys[responseKey],
            token[responseKey],
            cookieOptions
          )
        }

        if (response.httpAdaptorType === 'express' && response.cookie) {
          response.cookie(
            mapKeys[responseKey],
            token[responseKey],
            cookieOptions
          )
        }

        if (
          definitions.transferTokenMethod ===
          AuthTransferTokenMethod.COOKIE_ONLY
        ) {
          delete token[responseKey]
        }
      }
    }

    return { ...authResponse, token }
  }

@Injectable()
export class CookieAuthInterceptor implements NestInterceptor {
  public constructor(
    @InjectAuthDefinitions()
    protected readonly definitions: IAuthDefinitions
  ) {}

  public intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Observable<any> {
    const res = getResponseFromContext(context)

    res.httpAdaptorType = this.definitions.httpAdaptorType

    return next
      .handle()
      .pipe(
        map((tokenResponse: IAuthResponse) =>
          this.setCookieToken(res, tokenResponse)
        )
      )
  }

  public setCookieToken(res: IHttpResponse, tokenResponse: IAuthResponse): any {
    if (
      (res.httpAdaptorType === 'fastify' && !res.setCookie) ||
      (res.httpAdaptorType === 'express' && !res.cookie) ||
      this.definitions.transferTokenMethod ===
        AuthTransferTokenMethod.BEARER_ONLY ||
      !tokenResponse.token.accessToken
    ) {
      return tokenResponse
    }

    const transferFunction = transferFromResponseToCookie(res, this.definitions)

    return transferFunction(tokenResponse, {
      accessToken: 'AccessToken',
      refreshToken: 'RefreshToken',
    })
  }
}
