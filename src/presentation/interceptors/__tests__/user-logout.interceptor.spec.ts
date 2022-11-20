import { CallHandler, ExecutionContext } from '@nestjs/common'
import { lastValueFrom, Observable, of, tap } from 'rxjs'
import {
  createTestingModule,
  defaultAuthDefinitionsFixture,
} from '../../../__tests__/helpers'
import { LogoutAction, TokenService } from '../../../domain'
import { generateExecutionContextForJwtStrategy } from '../../../domain/guards/__tests__/helpers/test-guard.helper'
import { UserLogoutInterceptor } from '../user-logout.interceptor'

describe('ClearAuthCookieInterceptor', () => {
  applyTests('fastify')

  applyTests('express')
})

function applyTests(httpAdaptorType: 'fastify' | 'express') {
  let executionContext: ExecutionContext

  let interceptor: UserLogoutInterceptor
  let logoutAction: LogoutAction

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

      await testModule.init()

      const tokenService = testModule.get(TokenService)

      interceptor = testModule.get(UserLogoutInterceptor)

      logoutAction = testModule.get(LogoutAction)

      const accessToken = await lastValueFrom(
        tokenService.generateAccessToken(currentUserFixture)
      )

      executionContext = {
        ...generateExecutionContextForJwtStrategy(accessToken),
        getType: () => 'http' as any,
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
            getRequest: () => {
              return {
                user: {
                  userData: currentUserFixture,
                },
              }
            },
          }
        },
      }
    })

    it('the interceptor should be defined', async () => {
      expect(interceptor).toBeDefined()
    })

    it('the logoutAction should be defined', async () => {
      expect(logoutAction).toBeDefined()
    })

    it('clearAuthCookies function should be called', async () => {
      const spy = jest.spyOn(logoutAction, 'clearAuthCookies')

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
      const spy = jest.spyOn(logoutAction, 'clearAuthCookies')

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
            getRequest: () => {
              return {
                user: {
                  userData: currentUserFixture,
                },
              }
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
                  })
                )
              } else {
                expect(spy).toHaveBeenCalledWith(
                  expect.not.objectContaining({
                    cookie: expect.anything(),
                  })
                )
              }
            })
          )
      )
    })
  })
}
