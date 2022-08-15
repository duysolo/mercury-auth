import { CallHandler, ExecutionContext } from '@nestjs/common'
import { lastValueFrom, Observable, of, tap } from 'rxjs'
import {
  createTestingModule,
  defaultAuthDefinitionsFixture,
} from '../../../__tests__/helpers'
import { TokenService } from '../../../domain'
import { generateExecutionContextForJwtStrategy } from '../../../domain/guards/__tests__/helpers/test-guard.helper'
import { ClearAuthCookieInterceptor } from '../clear-auth-cookie.interceptor'

describe('ClearAuthCookieInterceptor', () => {
  applyTests('fastify')

  applyTests('express')
})

function applyTests(httpAdaptorType: 'fastify' | 'express') {
  let executionContext: ExecutionContext

  let interceptor: ClearAuthCookieInterceptor

  const fixture = defaultAuthDefinitionsFixture()

  const mockCallHandler: CallHandler = {
    handle(): Observable<any> {
      return of({})
    },
  }

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

      interceptor = testModule.get(ClearAuthCookieInterceptor)

      const accessToken = await lastValueFrom(
        tokenService.generateAccessToken(currentUserFixture)
      )

      executionContext = {
        ...generateExecutionContextForJwtStrategy(accessToken),
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
      }
    })

    it('the interceptor should be defined', async () => {
      expect(interceptor).toBeDefined()
    })

    it('clearAuthCookies function should be called', async () => {
      const spy = jest.spyOn(interceptor, 'clearAuthCookies')

      await lastValueFrom(
        interceptor.intercept(executionContext, mockCallHandler).pipe(
          tap(() => {
            expect(spy).toHaveBeenCalled()
            expect(spy).toHaveBeenCalledWith(
              expect.objectContaining({
                httpAdaptorType,
              })
            )
            expect(spy).toReturnWith(undefined)
          })
        )
      )
    })

    it('should ignore handling if cookie not available', async () => {
      const spy = jest.spyOn(interceptor, 'clearAuthCookies')

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
                    setCookie: expect.anything()
                  })
                )
              } else {
                expect(spy).toHaveBeenCalledWith(
                  expect.not.objectContaining({
                    cookie: expect.anything()
                  })
                )
              }
            })
          )
      )
    })
  })
}
