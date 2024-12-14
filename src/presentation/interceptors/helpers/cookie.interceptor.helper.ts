import {
  AuthTransferTokenMethod,
  IAuthDefinitions,
  IAuthWithTokenResponse,
  ICookieSerializeOptions,
  IHttpResponse,
  IJwtTokenResponse,
} from '../../../domain'

type IMapKeys<T> = Partial<{
  [responseKey in keyof T]: string
}>

export const transferTokenFromResponseToCookie: (
  response: IHttpResponse,
  definitions: IAuthDefinitions
) => (
  authResponse: IAuthWithTokenResponse,
  mapKeys: IMapKeys<IJwtTokenResponse>
) => Record<string, any> =
  (response, definitions) => (authResponse, mapKeys) => {
    if (
      (response.httpAdaptorType === 'fastify' && !response.setCookie) ||
      (response.httpAdaptorType === 'express' && !response.cookie) ||
      !definitions.transferTokenMethod ||
      ![
        AuthTransferTokenMethod.COOKIE_ONLY,
        AuthTransferTokenMethod.BOTH,
      ].includes(definitions.transferTokenMethod)
    ) {
      return authResponse
    }

    const token: IJwtTokenResponse = authResponse.token

    // eslint-disable-next-line guard-for-in
    for (const responseKey in mapKeys) {
      const currentToken = token[responseKey]
      const currentKey = mapKeys[responseKey]

      if (currentToken !== null && currentToken !== undefined) {
        const cookieOptions: ICookieSerializeOptions = {
          path: '/',
          httpOnly: true,
          sameSite: 'none',
          secure: process.env.NODE_ENV !== 'local',
          ...definitions.cookieOptions,

          expires:
            responseKey === 'refreshToken'
              ? token.refreshTokenExpiryDate
              : token.expiryDate,
        }

        if (response.httpAdaptorType === 'fastify' && response.setCookie) {
          response.setCookie(currentKey, currentToken, cookieOptions)
        }

        if (response.httpAdaptorType === 'express' && response.cookie) {
          response.cookie(currentKey, currentToken, cookieOptions)
        }

        if (
          definitions.transferTokenMethod ===
          AuthTransferTokenMethod.COOKIE_ONLY
        ) {
          delete token[responseKey]
        }
      }
    }

    return { ...authResponse, token }
  }
