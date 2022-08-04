import {
  createTestAuthApplicationExpress,
  defaultAuthDefinitionsFixture,
  expressRequest,
} from './helpers'
import { e2eTestsSetup } from './cases/e2e-tests'

describe('AuthModule (e2e) - Express Adaptor', () => {
  e2eTestsSetup({
    initApp: async () => {
      const definitions = defaultAuthDefinitionsFixture({
        httpAdaptorType: 'express',
      })

      const app = await createTestAuthApplicationExpress(definitions)

      return { app, definitions }
    },
    loginRequest: () => {
      return (app, body) =>
        expressRequest(app, {
          method: 'POST',
          path: '/auth/login',
          body,
        }).then((response) => {
          return {
            statusCode: response.statusCode,
            token: JSON.parse(response.text || '{}'),
          }
        })
    },
    refreshTokenRequest: () => {
      return (app, refreshToken) =>
        expressRequest(app, {
          method: 'POST',
          path: '/auth/refresh-token',
          headers: {
            'Refresh-Token': `${refreshToken}`,
          },
        }).then((response) => {
          return {
            statusCode: response.statusCode,
            token: JSON.parse(response.text || '{}'),
          }
        })
    },
    getProfileRequest: () => {
      return (app, accessToken) => {
        return expressRequest(app, {
          method: 'GET',
          path: '/auth/profile',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }).then((response) => {
          return {
            statusCode: response.statusCode,
            user: JSON.parse(response.text || '{}'),
          }
        })
      }
    },
    logoutRequest: () => {
      return (app, accessToken) =>
        expressRequest(app, {
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
