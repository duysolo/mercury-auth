import { HttpStatus } from '@nestjs/common'
import { NestFastifyApplication } from '@nestjs/platform-fastify'
import { IJwtTokenResponse } from '../domain'
import {
  createTestAuthApplicationFastify,
  defaultAuthDefinitionsFixture,
  fastifyRequest,
  generateCorrectUserPayload,
  generateCorrectUserPayloadImpersonate,
  generateInvalidUserPayload,
  generateInvalidUserPayloadImpersonate,
} from './helpers'

describe('AuthModule (e2e) - Fastify Adaptor', () => {
  let app: NestFastifyApplication

  const defaultFixture = defaultAuthDefinitionsFixture({
    httpAdaptorType: 'fastify',
  })

  beforeEach(async () => {
    app = await createTestAuthApplicationFastify(defaultFixture)
    await app.init()
  })

  afterAll(async () => {
    if (app) {
      await app.close()
    }
  })

  describe('PUBLIC', () => {
    describe('LoginController - Fastify', () => {
      it('should login failed if user does not match', async () => {
        await _shouldLoginFailed(app, generateInvalidUserPayload())
      })

      it('should login failed if invalid payload', async () => {
        await _shouldLoginFailed(app, {})
      })

      it('should login failed if user does not match - impersonate', async () => {
        await _shouldLoginFailed(app, generateInvalidUserPayloadImpersonate())
      })

      it('should login success', async () => {
        await _shouldLoginSuccess(app, generateCorrectUserPayload())
      })

      it('should login success - impersonate', async () => {
        await _shouldLoginSuccess(
          app,
          generateCorrectUserPayloadImpersonate(
            defaultFixture.impersonate || {
              cipher: '',
              password: '',
            }
          )
        )
      })
    })
  })

  describe('JWT', () => {
    let accessTokenResponse: IJwtTokenResponse

    beforeAll(async () => {
      accessTokenResponse = await doLoginRequest(
        app,
        generateCorrectUserPayload()
      ).then(
        (res) => res.json<IJwtTokenResponse>() || ({} as IJwtTokenResponse)
      )
    })

    describe('ProfileController', () => {
      it('should show user profile', async () => {
        await fastifyRequest(app, {
          method: 'GET',
          path: '/auth/profile',
          headers: {
            Authorization: `Bearer ${accessTokenResponse.accessToken}`,
          },
        }).then((res) => {
          expect(res.statusCode).toEqual(HttpStatus.OK)
        })
      })
    })

    describe('RefreshTokenController', () => {
      it('should allow user to refresh tokens', async () => {
        await fastifyRequest(app, {
          method: 'POST',
          path: '/auth/refresh-token',
          headers: {
            'Refresh-Token': `${accessTokenResponse.refreshToken}`,
          },
        }).then((res) => {
          const parsedTokenResponse: IJwtTokenResponse =
            res.json<IJwtTokenResponse>() || {}

          expect(res.statusCode).toEqual(HttpStatus.CREATED)
          expect(parsedTokenResponse.accessToken).toBeDefined()
          expect(parsedTokenResponse.refreshToken).toBeDefined()
          expect(parsedTokenResponse.expiryDate).toBeDefined()
        })
      })
    })

    describe('LogoutController', () => {
      it('should allow user to logout', async () => {
        await fastifyRequest(app, {
          method: 'POST',
          path: '/auth/logout',
          headers: {
            Authorization: `Bearer ${accessTokenResponse.accessToken}`,
          },
        }).then((res) => {
          expect(res.statusCode).toEqual(HttpStatus.CREATED)
        })
      })
    })
  })
})

async function _shouldLoginSuccess(
  app: NestFastifyApplication,
  body: Record<string, any>
) {
  return doLoginRequest(app, body).then((res) => {
    expect(res.statusCode).toEqual(HttpStatus.CREATED)

    const parsedTokenResponse =
      res.json<IJwtTokenResponse>() || ({} as IJwtTokenResponse)

    expect(parsedTokenResponse.accessToken).toBeDefined()
    expect(parsedTokenResponse.refreshToken).toBeDefined()
    expect(parsedTokenResponse.expiryDate).toBeDefined()
  })
}

async function _shouldLoginFailed(
  app: NestFastifyApplication,
  body: Record<string, any>
) {
  return doLoginRequest(app, body).then((res) => {
    expect(res.statusCode).toEqual(HttpStatus.UNAUTHORIZED)
  })
}

async function doLoginRequest(
  app: NestFastifyApplication,
  body: Record<string, any>
) {
  return fastifyRequest(app, {
    method: 'POST',
    path: '/auth/login',
    body,
  })
}
