import { HttpStatus, INestApplication } from '@nestjs/common'
import { IJwtTokenResponse } from '../domain'
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

  describe('ProfileController', () => {
    let user: IJwtTokenResponse

    beforeAll(async () => {
      user = await doLoginRequest(app, generateCorrectUserPayload()).then(
        (res) => {
          const parsedTokenResponse: IJwtTokenResponse = JSON.parse(
            res?.text || '{}'
          )

          return parsedTokenResponse
        }
      )
    })

    it('should show user profile', async () => {
      await expressRequest(app, {
        method: 'GET',
        path: '/auth/profile',
        headers: {
          Authorization: `Bearer ${user.accessToken}`,
        },
      }).then((res) => {
        expect(res?.statusCode).toEqual(HttpStatus.OK)
      })
    })
  })
})

async function _shouldLoginSuccess(
  app: INestApplication,
  body: Record<string, any>
) {
  return doLoginRequest(app, body).then((res) => {
    expect(res?.statusCode).toEqual(HttpStatus.CREATED)

    const parsedTokenResponse: IJwtTokenResponse = JSON.parse(res?.text || '{}')

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
    expect(res?.statusCode).toEqual(HttpStatus.UNAUTHORIZED)
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
