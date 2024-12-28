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
  IAuthWithTokenResponse,
  IHttpResponse,
  InjectAuthDefinitions,
} from '../../domain'
import { transferTokenFromResponseToCookie } from './helpers'

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
        map((tokenResponse: IAuthWithTokenResponse) =>
          this.setCookieToken(res, tokenResponse)
        )
      )
  }

  public setCookieToken(
    res: IHttpResponse,
    tokenResponse: IAuthWithTokenResponse
  ): any {
    if (
      (res.httpAdaptorType === 'fastify' && !res.setCookie) ||
      (res.httpAdaptorType === 'express' && !res.cookie) ||
      this.definitions.transferTokenMethod ===
        AuthTransferTokenMethod.BEARER_ONLY ||
      !tokenResponse.token.accessToken
    ) {
      return tokenResponse
    }

    const transferFunction = transferTokenFromResponseToCookie(
      res,
      this.definitions
    )

    return transferFunction(tokenResponse, {
      accessToken: 'Authorization',
      refreshToken: 'RefreshToken',
    })
  }
}
