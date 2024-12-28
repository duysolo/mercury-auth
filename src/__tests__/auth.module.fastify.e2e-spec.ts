import { NestFastifyApplication } from '@nestjs/platform-fastify'
import { IAuthWithTokenResponse, IRefreshTokenAuthResponse } from '../domain'
import { e2eTestsSetup } from './cases/e2e-tests'
import {
  createTestAuthApplicationFastify,
  defaultAuthDefinitionsFixture,
  fastifyRequest,
} from './helpers'

describe('AuthModule (e2e) - Fastify Adaptor', () => {
  e2eTestsSetup<NestFastifyApplication>({
    initApp: async () => {
      const definitions = defaultAuthDefinitionsFixture({
        httpAdaptorType: 'fastify',
      })

      const app = await createTestAuthApplicationFastify(definitions)

      return { app, definitions }
    },
    loginRequest: () => {
      return (app, body) =>
        fastifyRequest(app, {
          method: 'POST',
          path: '/auth/login',
          body,
        }).then((response) => {
          const parsedResponseBody: IAuthWithTokenResponse =
            response.json() || {}

          return {
            statusCode: response.statusCode,
            authResponse: parsedResponseBody,
            headers: response.headers,
            cookies: response.cookies,
          }
        })
    },
    refreshTokenRequest: () => {
      return (app, refreshToken) =>
        fastifyRequest(app, {
          method: 'POST',
          path: '/auth/refresh-token',
          headers: {
            'RefreshToken': `${refreshToken}`,
          },
        }).then((response) => {
          const parsedResponseBody: IRefreshTokenAuthResponse =
            response.json() || {}

          return {
            statusCode: response.statusCode,
            authResponse: parsedResponseBody,
            headers: response.headers,
            cookies: response.cookies,
          }
        })
    },
    getProfileRequest: () => {
      return (app, accessToken) => {
        return fastifyRequest(app, {
          method: 'GET',
          path: '/auth/profile',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }).then((response) => {
          return {
            statusCode: response.statusCode,
            userData: response.json() || {},
          }
        })
      }
    },
    logoutRequest: () => {
      return (app, accessToken) =>
        fastifyRequest(app, {
          method: 'POST',
          path: '/auth/logout',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }).then((response) => {
          return {
            statusCode: response.statusCode,
          }
        })
    },
  })
})

describe('AuthModule (e2e) - Fastify Adaptor - Without hashing token', () => {
  e2eTestsSetup<NestFastifyApplication>({
    initApp: async () => {
      const definitions = defaultAuthDefinitionsFixture({
        httpAdaptorType: 'fastify',
        enableHashingToken: false,
      })

      const app = await createTestAuthApplicationFastify(definitions)

      return { app, definitions }
    },
    loginRequest: () => {
      return (app, body) =>
        fastifyRequest(app, {
          method: 'POST',
          path: '/auth/login',
          body,
        }).then((response) => {
          const parsedResponseBody: IAuthWithTokenResponse =
            response.json() || {}

          return {
            statusCode: response.statusCode,
            authResponse: parsedResponseBody,
            headers: response.headers,
            cookies: response.cookies,
          }
        })
    },
    refreshTokenRequest: () => {
      return (app, refreshToken) =>
        fastifyRequest(app, {
          method: 'POST',
          path: '/auth/refresh-token',
          headers: {
            'RefreshToken': `${refreshToken}`,
          },
        }).then((response) => {
          const parsedResponseBody: IRefreshTokenAuthResponse =
            response.json() || {}

          return {
            statusCode: response.statusCode,
            authResponse: parsedResponseBody,
            headers: response.headers,
            cookies: response.cookies,
          }
        })
    },
    getProfileRequest: () => {
      return (app, accessToken) => {
        return fastifyRequest(app, {
          method: 'GET',
          path: '/auth/profile',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }).then((response) => {
          return {
            statusCode: response.statusCode,
            userData: response.json() || {},
          }
        })
      }
    },
    logoutRequest: () => {
      return (app, accessToken) =>
        fastifyRequest(app, {
          method: 'POST',
          path: '/auth/logout',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }).then((response) => {
          return {
            statusCode: response.statusCode,
          }
        })
    },
  })
})

describe('AuthModule (e2e) - Fastify Adaptor - Third-party JWT Token', () => {
  let app: NestFastifyApplication

  beforeEach(async () => {
    if (app) {
      await app.close()
    }

    const definitions = defaultAuthDefinitionsFixture({
      httpAdaptorType: 'fastify',
    })

    // eslint-disable-next-line
    app = await createTestAuthApplicationFastify(definitions)

    await app.init()
  })

  it('should show user profile', async () => {
    const accessToken = `eyJhbGciOiJSUzI1NiIsImtpZCI6ImJkMGFlMTRkMjhkMTY1NzhiMzFjOGJlNmM4ZmRlZDM0ZDVlMWExYzEiLCJ0eXAiOiJKV1QifQ.ewogICJuYW1lIjogIkR1eSBQaGFuIiwKICAicGljdHVyZSI6ICJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYSIsCiAgImlzcyI6ICJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vbmVzdC1hdXRoIiwKICAiYXVkIjogIm5lc3QtYXV0aCIsCiAgImF1dGhfdGltZSI6IDE3MzM1NjU0NjUsCiAgInVzZXJfaWQiOiAiYW1SVFd1RmR5aHhkZEZqVFdwSlFXTHVkMGd2MiIsCiAgInN1YiI6ICJhbVJUV3VGZHloeGRkRmpUV3BKUVdMdWQwZ3YyIiwKICAiaWF0IjogMTczNDE2ODQwNSwKICAiZXhwIjogMTczNDE3MjAwNSwKICAiZW1haWwiOiAiZHV5cHQuZGV2QGdtYWlsLmNvbSIsCiAgImVtYWlsX3ZlcmlmaWVkIjogdHJ1ZSwKICAiZmlyZWJhc2UiOiB7CiAgICAiaWRlbnRpdGllcyI6IHsKICAgICAgImdvb2dsZS5jb20iOiBbIjEyMzQ1NiJdLAogICAgICAiZW1haWwiOiBbImR1eXB0LmRldkBnbWFpbC5jb20iXQogICAgfSwKICAgICJzaWduX2luX3Byb3ZpZGVyIjogImdvb2dsZS5jb20iCiAgfQp9Cg.sMbtghRjSuqseCLaBaBkMrSra0L0ChGDdgN8xO8IPGsKUOvbViv16sMvd3KJ9eVPZ0bWljlIciNRQGcmZFMU7R3tesjaxusE7RnG5eawmCjwKCEBC7ZYbpviteAUx4GPenyVvCxYpOj2MN11ugGnM88tJHzTRcTcxI0REOZoqwd64p4iHKJF0Tp88-wPlIE8-qrNSmCgOAjBBv26ydeulSUhHweJryKdNR7gKtX6mWHH7AR9wsXjCJzSaD6W7aEKfqbCLkXTvLtO3b1RUy_WrG2q6dhKmwWVx-JSATwEVZOc_J1ESIAjpor508zCb82togOHRrCCDxt6_ZZxSMqqrw`

    const res = await fastifyRequest(app, {
      method: 'GET',
      path: '/auth/profile',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then((response) => {
        return {
          statusCode: response.statusCode,
          userData: response.json() || {},
        }
      })
      .catch(console.error)

    expect(res!.statusCode).toEqual(200)
  })
})
