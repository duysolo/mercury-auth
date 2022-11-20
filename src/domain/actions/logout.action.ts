import { ExecutionContext, Injectable } from '@nestjs/common'
import { EventBus } from '@nestjs/cqrs'
import { GqlExecutionContext } from '@nestjs/graphql'
import moment from 'moment/moment'
import { map, Observable, of, tap } from 'rxjs'
import { InjectAuthDefinitions } from '../decorators'
import {
  IAuthDefinitions,
  IAuthUserEntityForResponse,
  IRequestWithUser,
} from '../definitions'
import { UserLoggedOutEvent } from '../events'
import {
  getRequestFromContext,
  getRequestHeader,
  getResponseFromContext,
  ICookieSerializeOptions,
  IHttpResponse,
  removeBearerFromToken,
} from '../helpers'

export interface ILogoutActionOptions {
  context: ExecutionContext
}

@Injectable()
export class LogoutAction {
  public constructor(
    @InjectAuthDefinitions()
    protected readonly definitions: IAuthDefinitions,
    protected readonly eventBus: EventBus
  ) {}

  public handle({ context }: ILogoutActionOptions): Observable<void> {
    const res: IHttpResponse = {
      ...getResponseFromContext(context),
      httpAdaptorType: this.definitions.httpAdaptorType,
    }

    const request = getRequestFromContext(context)

    const user = getUserFromContext(context)

    const accessToken = removeBearerFromToken(
      getRequestHeader(request, 'authorization') as unknown as string
    )

    return of(res).pipe(
      tap(() => {
        this.clearAuthCookies(res)

        this.eventBus.publish(new UserLoggedOutEvent(accessToken, user))
      }),
      map(() => undefined)
    )
  }

  public clearAuthCookies(res: IHttpResponse): void {
    if (
      (res.httpAdaptorType === 'fastify' && !res.setCookie) ||
      (res.httpAdaptorType === 'express' && !res.cookie)
    ) {
      return
    }

    const cookieOptions: ICookieSerializeOptions = {
      path: '/',
      httpOnly: true,
      sameSite: 'none',
      secure: process.env.NODE_ENV !== 'local',

      ...this.definitions.cookieOptions,

      expires: moment().toDate(),
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

function getUserFromContext(context: ExecutionContext): IAuthUserEntityForResponse {
  if (`${context.getType()}` === 'graphql') {
    const gqlExecutionContext = GqlExecutionContext.create(context)

    return gqlExecutionContext.getContext().req.user?.userData
  }

  const request: IRequestWithUser = context.switchToHttp().getRequest()

  return request.user?.userData
}
