import { ExecutionContext, Injectable } from '@nestjs/common'
import { EventBus } from '@nestjs/cqrs'
import { GqlExecutionContext } from '@nestjs/graphql'
import { Observable, of } from 'rxjs'
import { InjectAuthDefinitions } from '../decorators'
import {
  IAuthDefinitions,
  IAuthUserEntityForResponse,
  IRequestWithUser,
} from '../definitions'
import { UserLoggedOutEvent } from '../events'
import {
  getRequestCookie,
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
    const res = getResponseFromContext(context)

    res.httpAdaptorType = this.definitions.httpAdaptorType

    const request = getRequestFromContext(context)

    const user = getUserFromContext(context)

    let currentToken = getRequestCookie(
      request,
      'Authorization'
    ) as unknown as string

    if (!currentToken) {
      currentToken = getRequestHeader(
        request,
        'authorization'
      ) as unknown as string
    }

    const accessToken = removeBearerFromToken(currentToken)

    this.eventBus.publish(new UserLoggedOutEvent(accessToken, user))

    this.clearAuthCookies(res)

    return of(undefined)
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

      expires: new Date(),
    }

    if (res.httpAdaptorType === 'fastify' && res.setCookie) {
      res.setCookie('Authorization', '', cookieOptions)
      res.setCookie('RefreshToken', '', cookieOptions)
    }

    if (res.httpAdaptorType === 'express' && res.cookie) {
      res.cookie('Authorization', '', cookieOptions)
      res.cookie('RefreshToken', '', cookieOptions)
    }
  }
}

function getUserFromContext(
  context: ExecutionContext
): IAuthUserEntityForResponse {
  if (`${context.getType()}` === 'graphql') {
    const gqlExecutionContext = GqlExecutionContext.create(context)

    return gqlExecutionContext.getContext().req.user?.userData
  }

  const request: IRequestWithUser = context.switchToHttp().getRequest()

  return request.user?.userData
}
