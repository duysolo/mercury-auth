import { NestFastifyApplication } from '@nestjs/platform-fastify'
import { IAuthResponse } from '../domain'
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
          const parsedResponseBody: IAuthResponse = response.json() || {}

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
            'Refresh-Token': `${refreshToken}`,
          },
        }).then((response) => {
          const parsedResponseBody: IAuthResponse = response.json() || {}

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
            user: response.json() || {},
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
