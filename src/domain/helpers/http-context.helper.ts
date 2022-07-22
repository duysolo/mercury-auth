import { ExecutionContext } from '@nestjs/common'

export interface CookieSerializeOptions {
  domain?: string
  expires?: Date
  httpOnly?: boolean
  maxAge?: number
  path?: string
  sameSite?: boolean | 'lax' | 'strict' | 'none'
  secure?: boolean
  signed?: boolean

  encode?(val: string): string
}

export interface IHttpRequest {
  headers: Record<string, any>
  cookies?: Record<string, any>
}

export interface IHttpResponse {
  setCookie?: (
    key: string,
    value: string,
    options: CookieSerializeOptions
  ) => void
}

export function getRequestFromContext(context: ExecutionContext): IHttpRequest {
  return context.switchToHttp().getRequest()
}

export function getResponseFromContext(
  context: ExecutionContext
): IHttpResponse {
  return context.switchToHttp().getResponse()
}

export function getRequestHeader(
  request: IHttpRequest,
  key?: string
): string | IHttpRequest['headers'] | undefined {
  const res = key ? request.headers[key] : request.headers

  if (!res) return undefined
}

export function getRequestCookie(
  request: IHttpRequest,
  key?: string
): string | IHttpRequest['cookies'] | undefined {
  if (request.cookies) {
    return key ? request.cookies[key] : request.cookies
  }

  return undefined
}
