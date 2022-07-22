import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common'
import moment from 'moment'
import { Observable, tap } from 'rxjs'
import {
  CookieSerializeOptions,
  getResponseFromContext,
  IHttpResponse,
} from '../../domain'
import {
  AUTH_DEFINITIONS_MODULE_OPTIONS,
  IAuthDefinitions,
} from '../../infrastructure'

@Injectable()
export class ClearAuthCookieInterceptor implements NestInterceptor {
  constructor(
    @Inject(AUTH_DEFINITIONS_MODULE_OPTIONS)
    protected readonly definitions: IAuthDefinitions
  ) {}

  public intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Observable<any> {
    const res: IHttpResponse = getResponseFromContext(context)

    res.httpAdaptorType = this.definitions.httpAdaptorType

    return next.handle().pipe(
      tap(() => {
        this.clearAuthCookies(res)
      })
    )
  }

  public clearAuthCookies(res: IHttpResponse): void {
    if (
      (res.httpAdaptorType === 'fastify' && !res.setCookie) ||
      (res.httpAdaptorType === 'express' && !res.cookie)
    ) {
      return
    }

    const cookieOptions: CookieSerializeOptions = {
      httpOnly: true,
      path: '/',
      maxAge: 0,
      sameSite: 'none',
      expires: moment().toDate(),
      secure: process.env.NODE_ENV !== 'local',
    }

    if (res.httpAdaptorType === 'fastify' && res.setCookie) {
      res.setCookie('AccessToken', '', cookieOptions)
      res.setCookie('RefreshToken', '', cookieOptions)
    }

    if (res.httpAdaptorType === 'express' && res.cookie) {
      res.cookie('AccessToken', '', cookieOptions)
      res.cookie('RefreshToken', '', cookieOptions)
    }
  }
}
