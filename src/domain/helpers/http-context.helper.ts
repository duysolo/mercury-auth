import { ExecutionContext } from '@nestjs/common'

export interface ICookieSerializeOptions {
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

export type IHttpResponse =
  | {
      httpAdaptorType: 'fastify'
      setCookie?: (
        key: string,
        value: string,
        options: ICookieSerializeOptions
      ) => void
    }
  | {
      httpAdaptorType: 'express'
      cookie?: (
        key: string,
        value: string,
        options: ICookieSerializeOptions
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
  if (request.headers) {
    return key ? request.headers[key] : request.headers
  }

  return undefined
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
