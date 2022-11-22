import { ExecutionContext } from '@nestjs/common'

export function generateExecutionContextForJwtStrategy(accessToken: string) {
  const getRequest = () => {
    return {
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    }
  }

  return {
    switchToHttp: () => {
      return {
        getResponse: () => ({}),
        getRequest,
      }
    },
    getRequest,
  } as unknown as ExecutionContext
}

export function generateExecutionContextForRefreshTokenStrategy(
  refreshToken: string
) {
  const getRequest = () => {
    return {
      headers: {
        'refresh-token': `${refreshToken}`,
      },
    }
  }

  return {
    switchToHttp: () => {
      return {
        getResponse: () => ({}),
        getRequest,
      }
    },
    getRequest,
    getResponse: () => ({}),
  } as unknown as ExecutionContext
}

export function generateExecutionContextForBasicAuth(
  username: string,
  password: string
) {
  const token = Buffer.from(`${username}:${password}`).toString('base64')

  const getRequest = () => {
    return {
      headers: {
        authorization: `Basic ${token}`,
      },
    }
  }

  return {
    switchToHttp: () => {
      return {
        getResponse: () => ({}),
        getRequest,
      }
    },
    getRequest,
    getResponse: () => ({}),
    getType: () => 'http'
  } as unknown as ExecutionContext
}

export function generateExecutionContextForLocalAuth(
  username: string,
  password: string,
  usernameField: string,
  passwordField: string
) {
  const getRequest = () => {
    return {
      body: {
        [usernameField]: username,
        [passwordField]: password,
      },
    }
  }

  return {
    switchToHttp: () => {
      return {
        getResponse: () => ({}),
        getRequest,
      }
    },
    getRequest,
    getResponse: () => ({}),
  } as unknown as ExecutionContext
}
