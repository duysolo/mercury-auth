import {
  AuthTransferTokenMethod,
  IAuthDefinitions,
  IAuthWithTokenResponse,
  IHttpResponse,
  IJwtTokenResponse,
} from '../../../../domain'
import { transferTokenFromResponseToCookie } from '../cookie.interceptor.helper'

describe('Cookie Interceptor Helper', () => {
  // Test both adaptor types
  testAdaptor('fastify')
  testAdaptor('express')
})

function testAdaptor(httpAdaptorType: 'fastify' | 'express') {
  describe(`For ${httpAdaptorType} adaptor`, () => {
    // Mock data
    const mockDate = new Date()
    const refreshTokenExpiryDate = new Date(mockDate.getTime() + 3600000 * 24) // 24 hours later
    const expiryDate = new Date(mockDate.getTime() + 3600000) // 1 hour later

    const mockTokenResponse: IJwtTokenResponse = {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      expiryDate,
      refreshTokenExpiryDate,
    }

    const mockAuthResponse: IAuthWithTokenResponse = {
      token: mockTokenResponse,
      userData: {
        id: 'user-id',
        username: 'test-user',
        email: 'test@example.com',
      },
    }

    const mockMapKeys = {
      accessToken: 'Authorization',
      refreshToken: 'Refresh-Token',
    }

    // Test when cookie functionality is available
    describe('when cookie functionality is available', () => {
      let mockResponse: IHttpResponse
      let mockCookie: jest.Mock
      let mockDefinitions: IAuthDefinitions

      beforeEach(() => {
        mockCookie = jest.fn()
        mockResponse = {
          httpAdaptorType,
          cookie: mockCookie,
        }

        mockDefinitions = {
          httpAdaptorType,
          transferTokenMethod: AuthTransferTokenMethod.BOTH,
          cookieOptions: {
            path: '/test',
            httpOnly: true,
          },
        }
      })

      it('should set cookies for both access and refresh tokens', () => {
        const result = transferTokenFromResponseToCookie(mockResponse, mockDefinitions)(
          mockAuthResponse,
          mockMapKeys
        )

        // Verify cookies were set
        expect(mockCookie).toHaveBeenCalledTimes(2)

        // Check access token cookie
        expect(mockCookie).toHaveBeenCalledWith(
          'Authorization',
          'mock-access-token',
          expect.objectContaining({
            path: '/test', // From mockDefinitions
            httpOnly: true,
            sameSite: 'none',
            expires: expiryDate,
          })
        )

        // Check refresh token cookie
        expect(mockCookie).toHaveBeenCalledWith(
          'Refresh-Token',
          'mock-refresh-token',
          expect.objectContaining({
            path: '/test', // From mockDefinitions
            httpOnly: true,
            sameSite: 'none',
            expires: refreshTokenExpiryDate,
          })
        )

        // Verify the response still contains the tokens (BOTH mode)
        expect(result).toEqual(mockAuthResponse)
      })

      it('should remove tokens from response when using COOKIE_ONLY mode', () => {
        mockDefinitions.transferTokenMethod = AuthTransferTokenMethod.COOKIE_ONLY

        const result = transferTokenFromResponseToCookie(mockResponse, mockDefinitions)(
          mockAuthResponse,
          mockMapKeys
        )

        // Verify cookies were set
        expect(mockCookie).toHaveBeenCalledTimes(2)

        // Verify tokens were removed from the response
        expect(result.token.accessToken).toBeUndefined()
        expect(result.token.refreshToken).toBeUndefined()

        // But expiry dates should still be present
        expect(result.token.expiryDate).toEqual(expiryDate)
        expect(result.token.refreshTokenExpiryDate).toEqual(refreshTokenExpiryDate)

        // User data should remain unchanged
        expect(result.userData).toEqual(mockAuthResponse.userData)
      })

      it('should handle null or undefined token values', () => {
        const authResponseWithNullToken: IAuthWithTokenResponse = {
          token: {
            ...mockTokenResponse,
            accessToken: null as any,
            refreshToken: undefined as any,
          },
          userData: mockAuthResponse.userData,
        }

        const result = transferTokenFromResponseToCookie(mockResponse, mockDefinitions)(
          authResponseWithNullToken,
          mockMapKeys
        )

        // No cookies should be set since token values are null/undefined
        expect(mockCookie).not.toHaveBeenCalled()

        // Response should be unchanged
        expect(result).toEqual(authResponseWithNullToken)
      })
    })

    // Test when cookie functionality is not available
    describe('when cookie functionality is not available', () => {
      let mockResponse: IHttpResponse
      let mockDefinitions: IAuthDefinitions

      beforeEach(() => {
        mockResponse = {
          httpAdaptorType,
        }

        mockDefinitions = {
          httpAdaptorType,
          transferTokenMethod: AuthTransferTokenMethod.BOTH,
        }
      })

      it('should return original response when cookie function is not available', () => {
        const result = transferTokenFromResponseToCookie(mockResponse, mockDefinitions)(
          mockAuthResponse,
          mockMapKeys
        )

        // Response should be unchanged
        expect(result).toEqual(mockAuthResponse)
      })
    })

    // Test different transfer token methods
    describe('with different transfer token methods', () => {
      let mockResponse: IHttpResponse
      let mockCookie: jest.Mock
      let mockDefinitions: IAuthDefinitions

      beforeEach(() => {
        mockCookie = jest.fn()
        mockResponse = {
          httpAdaptorType,
          cookie: mockCookie,
        }

        mockDefinitions = {
          httpAdaptorType,
          transferTokenMethod: AuthTransferTokenMethod.BEARER_ONLY,
        }
      })

      it('should not set cookies when using BEARER_ONLY mode', () => {
        const result = transferTokenFromResponseToCookie(mockResponse, mockDefinitions)(
          mockAuthResponse,
          mockMapKeys
        )

        // No cookies should be set
        expect(mockCookie).not.toHaveBeenCalled()

        // Response should be unchanged
        expect(result).toEqual(mockAuthResponse)
      })

      it('should not set cookies when transferTokenMethod is undefined', () => {
        mockDefinitions.transferTokenMethod = undefined

        const result = transferTokenFromResponseToCookie(mockResponse, mockDefinitions)(
          mockAuthResponse,
          mockMapKeys
        )

        // No cookies should be set
        expect(mockCookie).not.toHaveBeenCalled()

        // Response should be unchanged
        expect(result).toEqual(mockAuthResponse)
      })
    })
  })
}
