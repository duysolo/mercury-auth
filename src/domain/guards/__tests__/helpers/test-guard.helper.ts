import { ExecutionContext } from '@nestjs/common'

export function generateExecutionContextForJwtStrategy(accessToken: string) {
  const context: ExecutionContext = {
    switchToHttp: () => context,
    getRequest: () => {
      return {
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      }
    },
    getResponse: () => {},
  } as unknown as ExecutionContext

  return context
}

export function generateExecutionContextForRefreshTokenStrategy(
  refreshToken: string
) {
  const context: ExecutionContext = {
    switchToHttp: () => context,
    getRequest: () => {
      return {
        headers: {
          'refresh-token': `${refreshToken}`,
        },
      }
    },
    getResponse: () => {},
  } as unknown as ExecutionContext

  return context
}

export function generateExecutionContextForBasicAuth(
  username: string,
  password: string
) {
  const token = Buffer.from(`${username}:${password}`).toString('base64')

  const context: ExecutionContext = {
    switchToHttp: () => context,
    getRequest: () => {
      return {
        headers: {
          authorization: `Basic ${token}`,
        },
      }
    },
    getResponse: () => {},
  } as unknown as ExecutionContext

  return context
}

export function generateExecutionContextForLocalAuth(
  username: string,
  password: string,
  usernameField: string,
  passwordField: string
) {
  const context: ExecutionContext = {
    switchToHttp: () => context,
    getRequest: () => {
      return {
        body: {
          [usernameField]: username,
          [passwordField]: password,
        },
      }
    },
    getResponse: () => {},
  } as unknown as ExecutionContext

  return context
}
