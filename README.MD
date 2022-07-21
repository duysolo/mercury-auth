# Mercury Auth

#### A simple NestJS module package for authentication

## Install

```shell
npm install --save @mercury-labs/auth
```

## Register

```typescript
import { AuthModule, AuthTransferTokenMethod } from '@mercury-labs/auth'
import { ConfigService } from '@nestjs/config'

AuthModule.forRootAsync({
  definitions: {
    useFactory: (config: ConfigService) => {
      return {
        basicAuth: {
          username: config.get('BASIC_AUTH_USER') || '',
          password: config.get('BASIC_AUTH_PASSWORD') || '',
        },
        impersonate: {
          isEnabled: config.get('AUTH_IMPERSONATE_ENABLED') === 'true',
          cipher: config.get('AUTH_IMPERSONATE_CIPHER') || '',
          password: config.get('AUTH_IMPERSONATE_PASSWORD') || '',
        },
        jwt: {
          secret: config.get('AUTH_JWT_SECRET'),
          expiresIn: config.get('AUTH_JWT_EXPIRES') || '',
        },
        transferTokenMethod: config.get<AuthTransferTokenMethod>(
          'AUTH_TRANSFER_TOKEN_METHOD'
        ),
        redactedFields: ['password'],
        usernameField: 'username',
        passwordField: 'password',
      }
    },
    inject: [ConfigService],
  },
  providers: [
    {
      provide: AuthRepository,
      useClass: CmsAuthRepository,
    },
  ],
})
```
#### Notes:

```typescript
interface IAuthDefinitions {
  /**
   * Configuration for basic auth
   */
  basicAuth: {
    username: string
    password: string
  }

  /**
   * Configuration for JWT
   */
  jwt: {
    /**
     * Do not expose this key publicly. 
     * We have done so here to make it clear what the code is doing, 
     * but in a production system you must protect this key using appropriate measures, 
     * such as a secrets vault, environment variable, or configuration service.
     */
    secret: string
    /**
     * Expressed in seconds or a string describing a time span zeit/ms.
     * @see https://github.com/vercel/ms
     * Eg: 60, “2 days”, “10h”, “7d”
     */
    expiresIn: string | number
  }

  /**
   * Configuration for impersonate login
   * You can login to a user account without their password.
   * Eg: 
   *   - username: {your_impersonate_cipher_key}username
   *   - password: {your_impersonate_password}
   */
  impersonate?: {
    isEnabled: boolean
    cipher: string
    password: string
  }

  /**
   * Hide some sentitive fields while getting user profile.
   */
  redactedFields?: string[]

  /**
   * These routes will always be PUBLIC. 
   * No authentication required.
   */
  ignoredRoutes?: string[]

  /**
   * We accepted these 3 values: cookie|bearer|both
   * - cookie: after user login, their accessToken and refreshToken will be sent using cookie
   * - bearer: after user login, their accessToken and refreshToken will be sent to response body
   * - both: mixed those 2 above values.
   */
  transferTokenMethod: AuthTransferTokenMethod

  /**
   * Username field when login
   * Eg: email, username,...
   */
  usernameField?: string

  /**
   * Password field when login
   * Eg: password, pass...
   */
  passwordField?: string
}
```

## Define a database repository to get user info

