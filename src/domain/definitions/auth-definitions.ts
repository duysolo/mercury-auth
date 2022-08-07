import { JwtSignOptions } from '@nestjs/jwt/dist/interfaces'
import { ICookieSerializeOptions } from '../helpers'
import { AuthTransferTokenMethod } from './auth-transfer-token-method.enum'

export interface IAuthDefinitions {
  basicAuth: {
    username: string
    password: string
    realm?: string
  }

  jwt: {
    secret: string
    /**
     * Expressed in seconds or a string describing a time span zeit/ms.
     * @see https://github.com/vercel/ms
     * Eg: 60, “2 days”, “10h”, “7d”
     */
    signOptions?: Omit<JwtSignOptions, 'expiresIn'>
    expiresIn: string | number
    refreshTokenExpiresIn: string | number
  }

  impersonate?: {
    isEnabled: boolean
    cipher: string
    password: string
  }

  redactedFields?: string[]
  ignoredRoutes?: string[]

  hashingSecretKey: string

  transferTokenMethod: AuthTransferTokenMethod

  cookieOptions?: Pick<
    ICookieSerializeOptions,
    'domain' | 'path' | 'sameSite' | 'signed' | 'httpOnly' | 'secure'
  >

  usernameField?: string
  passwordField?: string

  httpAdaptorType: 'fastify' | 'express'
}
