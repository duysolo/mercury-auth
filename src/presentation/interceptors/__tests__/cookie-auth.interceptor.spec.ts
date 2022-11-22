import { CallHandler, ExecutionContext } from '@nestjs/common'
import { lastValueFrom, Observable, of, tap } from 'rxjs'
import {
  createTestingModule,
  defaultAuthDefinitionsFixture,
} from '../../../__tests__/helpers'
import { IAuthWithTokenResponse, TokenService } from '../../../domain'
import { CookieAuthInterceptor } from '../cookie-auth.interceptor'

describe('CookieAuthInterceptor', () => {
  applyTests('fastify')

  applyTests('express')
})

function applyTests(httpAdaptorType: 'fastify' | 'express') {
  let executionContext: ExecutionContext

  let interceptor: CookieAuthInterceptor

  const fixture = defaultAuthDefinitionsFixture()

  let mockCallHandler: CallHandler

  const currentUserFixture = {
    id: 'sample-user-id',
    username: 'sample-user@gmail.com',
    email: 'sample-user@gmail.com',
  }

  describe(`For ${httpAdaptorType} adaptor`, () => {
    beforeAll(async () => {
      const testModule = await createTestingModule({
        ...fixture,
        httpAdaptorType,
      })

      const tokenService = testModule.get(TokenService)

      interceptor = testModule.get(CookieAuthInterceptor)

      const iJwtTokenResponse = await lastValueFrom(
        tokenService.generateTokenResponse(currentUserFixture)
      )

      mockCallHandler = {
        handle(): Observable<IAuthWithTokenResponse> {
          return of({
            token: iJwtTokenResponse,
            userData: currentUserFixture,
          })
        },
      }

      executionContext = {
        switchToHttp: (): any => {
          return {
            getResponse: () => {
              if (httpAdaptorType === 'fastify') {
                return {
                  setCookie: () => undefined,
                }
              }

              return {
                cookie: () => undefined,
              }
            },
          }
        },
        getType: () => 'http',
      } as any
    })

    it('the interceptor should be defined', async () => {
      expect(interceptor).toBeDefined()
    })

    it('setCookieToken function should be called', async () => {
      const spy = jest.spyOn(interceptor, 'setCookieToken')

      await lastValueFrom(
        interceptor.intercept(executionContext, mockCallHandler).pipe(
          tap(() => {
            expect(spy).toHaveBeenCalled()
            expect(spy).toHaveBeenCalledWith(
              expect.objectContaining({
                httpAdaptorType,
              }),
              expect.objectContaining({
                userData: currentUserFixture,
              })
            )
            expect(spy).toReturnWith(
              expect.objectContaining({
                userData: currentUserFixture,
              })
            )
          })
        )
      )
    })

    it('should ignore handling if cookie not available', async () => {
      const spy = jest.spyOn(interceptor, 'setCookieToken')

      const executionContextWithoutCookie = {
        ...executionContext,
        switchToHttp: (): any => {
          return {
            getResponse: () => {
              if (httpAdaptorType === 'fastify') {
                return {}
              }

              return {}
            },
          }
        },
      }

      await lastValueFrom(
        interceptor
          .intercept(executionContextWithoutCookie, mockCallHandler)
          .pipe(
            tap(() => {
              if (httpAdaptorType === 'fastify') {
                expect(spy).toHaveBeenCalledWith(
                  expect.not.objectContaining({
                    setCookie: expect.anything(),
                  }),
                  expect.objectContaining({
                    userData: currentUserFixture,
                  })
                )
              } else {
                expect(spy).toHaveBeenCalledWith(
                  expect.not.objectContaining({
                    cookie: expect.anything(),
                  }),
                  expect.objectContaining({
                    userData: currentUserFixture,
                  })
                )
              }
            })
          )
      )
    })
  })
}
