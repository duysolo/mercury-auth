import {
  CallHandler,
  ExecutionContext,
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

@Injectable()
export class ClearAuthCookieInterceptor implements NestInterceptor {
  public intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Observable<any> {
    const res: IHttpResponse = getResponseFromContext(context)

    return next.handle().pipe(
      tap(() => {
        this.clearAuthCookies(res)
      })
    )
  }

  public clearAuthCookies(res: IHttpResponse): void {
    if (!res.setCookie) {
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

    res.setCookie('AccessToken', '', cookieOptions)

    res.setCookie('RefreshToken', '', cookieOptions)
  }
}
