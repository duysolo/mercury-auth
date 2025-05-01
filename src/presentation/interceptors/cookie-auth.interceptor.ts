import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common'
import { map, Observable } from 'rxjs'
import {
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
    const transferFunction = transferTokenFromResponseToCookie(
      res,
      this.definitions
    )

    return transferFunction(tokenResponse, {
      accessToken: 'Authorization',
      refreshToken: 'Refresh-Token',
    })
  }
}
