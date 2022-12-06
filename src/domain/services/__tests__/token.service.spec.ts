import { isString } from 'lodash'
import { lastValueFrom, map, tap } from 'rxjs'
import {
  createTestingModule,
  defaultAuthDefinitionsFixture,
} from '../../../__tests__/helpers'
import { IAuthUserEntityForResponse } from '../../definitions'
import { TokenService } from '../token.service'

describe('TokenService', () => {
  let service: TokenService

  const userInfo: IAuthUserEntityForResponse = {
    id: '123456',
    username: 'sample-user@gmail.com',
  }

  beforeAll(async () => {
    const app = await createTestingModule(defaultAuthDefinitionsFixture())

    service = app.get(TokenService)
  })

  it('should able to generate token response', async () => {
    await lastValueFrom(
      service.generateTokenResponse(userInfo).pipe(
        tap((res) => {
          expect(res.expiryDate).toBeInstanceOf(Date)
          expect(res.refreshTokenExpiryDate).toBeInstanceOf(Date)

          expect(res.accessToken).toBeDefined()
          expect(res.refreshToken).toBeDefined()
        })
      )
    )
  })

  it('should able to decode access token', async () => {
    await lastValueFrom(
      service.generateAccessToken(userInfo).pipe(
        map((res) => service.decodeAccessToken(res)),
        tap((res) => {
          expect(res?.username).toEqual(userInfo.username)
          expect(res?.sub).toEqual(userInfo.id)
          expect(res?.exp).toBeGreaterThan(0)
          expect(res?.iat).toBeGreaterThan(0)
        })
      )
    )
  })

  it('should able to generate refresh token', async () => {
    await lastValueFrom(
      service.generateRefreshToken(userInfo).pipe(
        tap((res) => {
          expect(res).toBeDefined()
          expect(isString(res)).toBeTruthy()
          expect(res.length).toBeGreaterThan(0)
        })
      )
    )
  })

  it('should able to decode refresh token', async () => {
    await lastValueFrom(
      service.generateTokenResponse(userInfo).pipe(
        map((res) => service.decodeRefreshToken(res.refreshToken)),
        tap((res) => {
          expect(res?.username).toEqual(userInfo.username)
          expect(res?.sub).toEqual(userInfo.id)
          expect(res?.exp).toBeGreaterThan(0)
          expect(res?.iat).toBeGreaterThan(0)
        })
      )
    )
  })
})
