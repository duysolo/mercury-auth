import { JwtFromRequestFunction } from 'passport-jwt'
import { AuthTransferTokenMethod } from '../definitions'
import {
  getRequestCookie,
  getRequestHeader,
  IHttpRequest,
} from './http-context.helper'
import { removeBearerFromToken } from './remove-bearer-from-token.helper'

export const cookieExtractor: (
  key: string
) => (
  transferTokenMethod: AuthTransferTokenMethod | undefined
) => JwtFromRequestFunction =
  (key = 'Authorization') =>
  (transferTokenMethod) =>
  (request: IHttpRequest): string | any => {
    if (transferTokenMethod === AuthTransferTokenMethod.BEARER_ONLY) {
      return null
    }

    const cookieAuthHeaders = [key, key.toLowerCase()].map(
      (k) => getRequestCookie(request, k) as string | undefined
    )

    const cookieAuthHeader = cookieAuthHeaders.find(
      (i) => !!i && typeof i === 'string'
    )

    if (!cookieAuthHeader) {
      return null
    }

    return removeBearerFromToken(cookieAuthHeader) || null
  }

export const headerExtractor: (
  key: string
) => (
  transferTokenMethod: AuthTransferTokenMethod | undefined
) => JwtFromRequestFunction =
  (key = 'authorization') =>
  (transferTokenMethod) =>
  (request: IHttpRequest): string | any => {
    if (transferTokenMethod === AuthTransferTokenMethod.COOKIE_ONLY) {
      return null
    }

    const authHeaders = [key, key.toLowerCase()].map(
      (k) => getRequestHeader(request, k) as string | undefined
    )

    const authHeader = authHeaders.find((i) => !!i && typeof i === 'string')

    if (!authHeader) {
      return null
    }

    return removeBearerFromToken(authHeader)
  }

export const cookieExtractorForAuthorization = cookieExtractor('Authorization')
export const headerExtractorForAuthorization = headerExtractor('Authorization')

export const cookieExtractorForRefreshToken = cookieExtractor('RefreshToken')
export const headerExtractorForRefreshToken = headerExtractor('RefreshToken')

export const cookieExtractorForApiKey = cookieExtractor('ApiKey')
export const headerExtractorForApiKey = headerExtractor('ApiKey')
