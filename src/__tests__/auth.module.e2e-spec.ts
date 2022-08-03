import { HttpStatus, INestApplication } from '@nestjs/common'
import { TestingModule } from '@nestjs/testing'
import request, { Response } from 'supertest'
import { IJwtTokenResponse } from '../domain'
import {
  createTestAuthModule,
  defaultAuthDefinitionsFixture,
  generateCorrectUserPayload,
  generateInvalidUserPayload,
} from './helpers'

describe('AuthModule (e2e)', () => {
  let app: INestApplication

  beforeEach(async () => {
    const moduleFixture: TestingModule = await createTestAuthModule(
      defaultAuthDefinitionsFixture
    )

    app = moduleFixture.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    if (app) {
      await app.close()
    }
  })

  describe('LoginController', () => {
    it('should login success (POST)', () => {
      request(app.getHttpServer())
        .post('/auth/login')
        .send(generateCorrectUserPayload())
        .expect(HttpStatus.CREATED)
        .then(({ text }: Response) => {
          const parsedTokenResponse: IJwtTokenResponse = JSON.parse(text)

          expect(parsedTokenResponse.accessToken).toBeDefined()
          expect(parsedTokenResponse.refreshToken).toBeDefined()
          expect(parsedTokenResponse.expiryDate).toBeDefined()
        })
    })

    it('should login failed if user does not match (POST)', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send(generateInvalidUserPayload())
        .expect(HttpStatus.UNAUTHORIZED)
    })
  })
})
