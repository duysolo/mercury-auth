import type { CookieSerializeOptions } from '@fastify/cookie'
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common'
import type { FastifyReply } from 'fastify'
import moment from 'moment'
import { Observable, tap } from 'rxjs'

@Injectable()
export class ClearAuthCookieInterceptor implements NestInterceptor {
  public intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Observable<any> {
    const res: FastifyReply = context.switchToHttp().getResponse()

    return next.handle().pipe(
      tap(() => {
        this.clearAuthCookies(res)
      })
    )
  }

  public clearAuthCookies(res: FastifyReply): void {
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

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    res.setCookie('AccessToken', '', cookieOptions)

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    res.setCookie('RefreshToken', '', cookieOptions)
  }
}
