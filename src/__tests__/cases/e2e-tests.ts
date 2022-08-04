import { HttpStatus, INestApplication } from '@nestjs/common'
import { IAuthUserEntityForResponse, IJwtTokenResponse } from '../../domain'
import { IAuthDefinitions } from '../../infrastructure'
import {
  generateCorrectUserPayload,
  generateCorrectUserPayloadImpersonate,
  generateInvalidUserPayload,
  generateInvalidUserPayloadImpersonate,
} from '../helpers'

interface ITokenResponse {
  statusCode: HttpStatus
  token: IJwtTokenResponse
}

interface IProfileResponse {
  statusCode: HttpStatus
  user: IAuthUserEntityForResponse
}

interface IE2ETestsSetupOptions<NestAppType = INestApplication> {
  initApp: () => Promise<{ app: NestAppType; definitions: IAuthDefinitions }>

  loginRequest: () => (
    app: NestAppType,
    body: Record<string, any>
  ) => Promise<ITokenResponse>
  refreshTokenRequest: (
    useCookie?: boolean
  ) => (app: NestAppType, refreshToken: string) => Promise<ITokenResponse>
  getProfileRequest: (
    useCookie?: boolean
  ) => (app: NestAppType, accessToken: string) => Promise<IProfileResponse>
  logoutRequest: (
    useCookie?: boolean
  ) => (
    app: NestAppType,
    accessToken: string
  ) => Promise<{ statusCode: HttpStatus }>
}

export function e2eTestsSetup<T extends INestApplication>(
  options: IE2ETestsSetupOptions<T>
) {
  let app: T

  let authDefinitions: IAuthDefinitions

  beforeEach(async () => {
    const res = await options.initApp()

    app = res.app

    await app.init()

    authDefinitions = res.definitions
  })

  afterAll(async () => {
    if (app) {
      await app.close()
    }
  })

  const loginSuccessCheck = (res) => {
    expect(res.statusCode).toEqual(HttpStatus.CREATED)
    expect(res.token.accessToken).toBeDefined()
    expect(res.token.refreshToken).toBeDefined()
    expect(res.token.expiryDate).toBeDefined()
  }
  const loginFailedCheck = (res) => {
    expect(res.statusCode).toEqual(HttpStatus.UNAUTHORIZED)
  }

  describe('PUBLIC', () => {
    describe('LoginController', () => {
      it('should login success', async () => {
        loginSuccessCheck(
          await options.loginRequest()(app, generateCorrectUserPayload())
        )
      })

      it('should login success - impersonate', async () => {
        loginSuccessCheck(
          await options.loginRequest()(
            app,
            generateCorrectUserPayloadImpersonate(
              authDefinitions.impersonate || {
                cipher: '',
                password: '',
              }
            )
          )
        )
      })

      it('should login failed if user does not match', async () => {
        await loginFailedCheck(
          await options.loginRequest()(app, generateInvalidUserPayload())
        )
      })

      it('should login failed if invalid payload', async () => {
        await loginFailedCheck(await options.loginRequest()(app, {}))
      })

      it('should login failed if user does not match - impersonate', async () => {
        await loginFailedCheck(
          await options.loginRequest()(
            app,
            generateInvalidUserPayloadImpersonate()
          )
        )
      })
    })
  })

  describe('JWT Strategy', () => {
    let response: ITokenResponse

    beforeAll(async () => {
      response = await options.loginRequest()(app, generateCorrectUserPayload())
    })

    describe('ProfileController', () => {
      it('should show user profile', async () => {
        const res = await options.getProfileRequest()(
          app,
          response.token.accessToken
        )

        expect(res.statusCode).toEqual(HttpStatus.OK)
        expect(res.user).toBeDefined()
        expect(res.user.id).toBeDefined()
        expect(res.user.username).toBeDefined()
      })
    })

    describe('RefreshTokenController', () => {
      it('should allow user to refresh tokens', async () => {
        loginSuccessCheck(
          await options.refreshTokenRequest()(app, response.token.refreshToken)
        )
      })
    })

    describe('LogoutController', () => {
      it('should allow user to logout', async () => {
        const res = await options.logoutRequest()(
          app,
          response.token.accessToken
        )

        expect(res.statusCode).toEqual(HttpStatus.CREATED)
      })
    })
  })
}
