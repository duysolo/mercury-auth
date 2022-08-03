import { HttpStatus, INestApplication } from '@nestjs/common'
import { IAuthUserEntityForResponse, IJwtTokenResponse } from '../domain'
import {
  createTestAuthApplicationExpress,
  defaultAuthDefinitionsFixture,
  expressRequest,
  generateCorrectUserPayload,
  generateCorrectUserPayloadImpersonate,
  generateInvalidUserPayload,
  generateInvalidUserPayloadImpersonate,
} from './helpers'

describe('AuthModule (e2e) - Express Adaptor', () => {
  let app: INestApplication

  const defaultFixture = defaultAuthDefinitionsFixture({
    httpAdaptorType: 'express',
  })

  beforeEach(async () => {
    app = await createTestAuthApplicationExpress(defaultFixture)
    await app.init()
  })

  afterAll(async () => {
    if (app) {
      await app.close()
    }
  })

  describe('PUBLIC', () => {
    describe('LoginController', () => {
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

      it('should login failed if user does not match', async () => {
        await _shouldLoginFailed(app, generateInvalidUserPayload())
      })

      it('should login failed if invalid payload', async () => {
        await _shouldLoginFailed(app, {})
      })

      it('should login failed if user does not match - impersonate', async () => {
        await _shouldLoginFailed(app, generateInvalidUserPayloadImpersonate())
      })
    })
  })

  describe('JWT', () => {
    let accessTokenResponse: IJwtTokenResponse

    beforeAll(async () => {
      accessTokenResponse = await doLoginRequest(
        app,
        generateCorrectUserPayload()
      ).then((res) => {
        return JSON.parse(res.text || '{}')
      })
    })

    describe('ProfileController', () => {
      it('should show user profile', async () => {
        await expressRequest(app, {
          method: 'GET',
          path: '/auth/profile',
          headers: {
            Authorization: `Bearer ${accessTokenResponse.accessToken}`,
          },
        }).then((res) => {
          const user: IAuthUserEntityForResponse = JSON.parse(res.text || '{}')

          expect(res.statusCode).toEqual(HttpStatus.OK)
          expect(user.id).toBeDefined()
          expect(user.username).toBeDefined()
        })
      })
    })

    describe('RefreshTokenController', () => {
      it('should allow user to refresh tokens', async () => {
        await expressRequest(app, {
          method: 'POST',
          path: '/auth/refresh-token',
          headers: {
            'Refresh-Token': `${accessTokenResponse.refreshToken}`,
          },
        }).then((res) => {
          const parsedTokenResponse: IJwtTokenResponse = JSON.parse(
            res.text || '{}'
          )

          expect(res.statusCode).toEqual(HttpStatus.CREATED)
          expect(parsedTokenResponse.accessToken).toBeDefined()
          expect(parsedTokenResponse.refreshToken).toBeDefined()
          expect(parsedTokenResponse.expiryDate).toBeDefined()
        })
      })
    })

    describe('LogoutController', () => {
      it('should allow user to logout', async () => {
        await expressRequest(app, {
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
  app: INestApplication,
  body: Record<string, any>
) {
  return doLoginRequest(app, body).then((res) => {
    expect(res.statusCode).toEqual(HttpStatus.CREATED)

    const parsedTokenResponse: IJwtTokenResponse = JSON.parse(res.text || '{}')

    expect(parsedTokenResponse.accessToken).toBeDefined()
    expect(parsedTokenResponse.refreshToken).toBeDefined()
    expect(parsedTokenResponse.expiryDate).toBeDefined()
  })
}

async function _shouldLoginFailed(
  app: INestApplication,
  body: Record<string, any>
) {
  return doLoginRequest(app, body).then((res) => {
    expect(res.statusCode).toEqual(HttpStatus.UNAUTHORIZED)
  })
}

async function doLoginRequest(
  app: INestApplication,
  body: Record<string, any>
) {
  return expressRequest(app, {
    method: 'POST',
    path: '/auth/login',
    body,
  })
}
