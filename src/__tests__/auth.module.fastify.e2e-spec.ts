import { NestFastifyApplication } from '@nestjs/platform-fastify'
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
          const parsedResponseBody = response.json() || {}

          return {
            statusCode: response.statusCode,
            token: parsedResponseBody.token,
            headers: response.headers,
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
          const parsedResponseBody = response.json() || {}

          return {
            statusCode: response.statusCode,
            token: parsedResponseBody.token,
            headers: response.headers,
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
