# Mercury Auth

### A NestJS module package for authentication.

#### Support both `FasitfyAdaptor` and `ExpressAdaptor`.

## Install

```shell
npm install --save @mercury-labs/nest-auth
```

Learn more about the relevant
package [@mercury-labs/nest-hashing](https://www.npmjs.com/package/@mercury-labs/nest-hashing)

## Sample usages

- Fastify [https://github.com/duysolo/mercury-auth-samples/tree/master/fastify](https://github.com/duysolo/mercury-auth-samples/tree/master/fastify)
- Express [https://github.com/duysolo/mercury-auth-samples/tree/master/express](https://github.com/duysolo/mercury-auth-samples/tree/master/express)
- Apollo Graphql Express [https://github.com/duysolo/mercury-auth-samples/tree/master/apollo-graphql-express](https://github.com/duysolo/mercury-auth-samples/tree/master/apollo-graphql-express)

## Define a database repository to get user info

```typescript
import {
  AUTH_PASSWORD_HASHER,
  AuthRepository,
  IAuthUserEntity,
  PasswordHasherService
} from '@mercury-labs/nest-auth'
import { Injectable } from '@nestjs/common'
import moment from 'moment'
import { Observable, of } from 'rxjs'

export class SampleAuthRepository implements AuthRepository<string, AuthDto> {
  /**
   * Your own throttle service
   * Sample demo
   */
  private _throttleAuthService: ThrottleAuthService

  public constructor(
    @InjectPasswordHasher()
    protected readonly hasher: PasswordHasherService,
    protected readonly moduleRef: ModuleRef
  ) {
  }

  public onModuleInit(): void {
    this._throttleAuthService = this.moduleRef.get(ThrottleAuthService)
  }

  public getAuthUserByUsername(
    username: string
  ): Observable<IAuthUserEntity | undefined> {
    return of({
      id: 'some-random-id',
      username: 'sample-user@gmail.com',
      email: 'sample-user@gmail.com',
      password: 'some-password-hash',
    })
  }

  public authenticate(
    username: string,
    request: AuthDto,
    impersonated: boolean
  ): Observable<IAuthUserEntity | undefined> {
    /**
     * Ignore the other checks if impersonated
     */
    if (impersonated) {
      return this.getAuthUserByUsername(username)
    }

    /**
     * Do some additional logics
     */
    return this._throttleAuthService.checkAlreadyBlockedAccount(username).pipe(
      mergeMap(() => this.getAuthUserByUsername(username))
    )
  }

  public getAuthUserByAccessToken(
    accessToken: string,
    jwtPayload: IJwtPayload
  ): Observable<IAuthUserEntity | undefined> {
    /**
     * You can check the token if it's stored in database.
     */

    return this.getAuthUserByUsername(jwtPayload.username)
  }

  public getAuthUserByRefreshToken(
    refreshToken: string,
    jwtPayload: IJwtPayload
  ): Observable<IAuthUserEntity | undefined> {
    /**
     * You can check the token if it's stored in database.
     */

    return this.getAuthUserByUsername(jwtPayload.username)
  }
}
```

The repository demo was built on top of RxJS, but you can also define it with `Promise` - `async`/`await`.

For example:

```typescript
@Injectable()
export class SampleAuthRepository implements AuthRepository<string, AuthDto> {
  public constructor(
    @InjectPasswordHasher()
    protected readonly hasher: PasswordHasherService
  ) {}

  public async getAuthUserByUsername(
    username: string
  ): Promise<IAuthUserEntity | undefined> {
    return {
      id: _.random(1, 1999).toString(),
      username: 'sample-user@gmail.com',
      email: 'sample-user@gmail.com',
      password: await this.hasher.hash('testLogin@12345'),
    }
  }

  public async authenticate(
    username: string,
    request: AuthDto,
    impersonated: boolean
  ): Promise<IAuthUserEntity | undefined> {
    const user = await this.getAuthUserByUsername(username)

    if (impersonated) {
      return user
    }

    /**
     * Do some additional logics
     */

    return user
  }

  public async getAuthUserByAccessToken(
    accessToken: string,
    jwtPayload: IJwtPayload
  ): Promise<IAuthUserEntity | undefined> {
    /**
     * You can check the token if it's stored in database.
     */

    return this.getAuthUserByUsername(jwtPayload.username)
  }

  public async getAuthUserByRefreshToken(
    refreshToken: string,
    jwtPayload: IJwtPayload
  ): Promise<IAuthUserEntity | undefined> {
    /**
     * You can check the token if it's stored in database.
     */

    return this.getAuthUserByUsername(jwtPayload.username)
  }
}
```

## Register `AuthModule` to your application module

```typescript
import { AuthModule, AuthTransferTokenMethod } from '@mercury-labs/nest-auth'
import { ConfigService } from '@nestjs/config'
import { Module } from '@nestjs/common'

@Module({
  imports: [
    AuthModule.forRootAsync({
      /**
       * Use default local auth or not?
       * For example, you're using GraphQL and want to disable default HTTP auth
       */
      useLocalAuth: true,
      global: true,
      definitions: {
        useFactory: (config: ConfigService) => {
          return {
            basicAuth: {
              username: config.get('BASIC_AUTH_USER'),
              password: config.get('BASIC_AUTH_PASSWORD'),
            },
            impersonate: {
              isEnabled: config.get('AUTH_IMPERSONATE_ENABLED') === 'true',
              cipher: config.get('AUTH_IMPERSONATE_CIPHER'),
              password: config.get('AUTH_IMPERSONATE_PASSWORD'),
            },
            jwt: {
              secret: config.get('AUTH_JWT_SECRET'),
              expiresIn: envRequired('AUTH_JWT_EXPIRES') || '1h',
              refreshTokenExpiresIn: envRequired('AUTH_JWT_REFRESH_EXPIRES') || '7d',
            },
            transferTokenMethod: config.get<AuthTransferTokenMethod>(
              'AUTH_TRANSFER_TOKEN_METHOD'
            ),
            redactedFields: ['password'],
            hashingSecretKey: config.get('HASHING_SECRET_KEY') || '',
            usernameField: 'username',
            passwordField: 'password',
            httpAdaptorType: 'fastify'
          }
        },
        inject: [ConfigService],
      },
      /**
       * In case you want to register some providers inside AuthModule
       * These providers will be also exported from AuthModule
       */
      otherProviders: [],
      authRepository: {
        useFactory: (hasher: PasswordHasherService) => {
          return new CmsAuthRepository(hasher)
        },
        inject: [AUTH_PASSWORD_HASHER]
      }
    }),
  ]
})
export class AppModule {
}
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
    /**
     * The realm name for WWW-Authenticate header
     */
    realm?: string
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
    refreshTokenExpiresIn: string | number
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

  enableHashingToken?: boolean
  /**
   * Used to encode/decode the access/refresh token
   * 32 characters string
   */
  hashingSecretKey?: string

  /**
   * We accepted these 3 values: cookie|bearer|both
   * - cookie: after user login, their accessToken and refreshToken will be sent using cookie
   * - bearer: after user login, their accessToken and refreshToken will be sent to response body
   * - both: mixed those 2 above values.
   */
  transferTokenMethod: AuthTransferTokenMethod,

  cookieOptions?: {
    domain?: string
    path?: string // Default '/'
    sameSite?: boolean | 'lax' | 'strict' | 'none' // Default true
    signed?: boolean
    httpOnly?: boolean // Default true
    secure?: boolean
  },

  /**
   * Username field when login
   * Eg: email, username,...
   */
  usernameField?: string

  /**
   * Password field when login
   * Eg: password, pass...
   */
  passwordField?: string,

  httpAdaptorType: 'fastify' | 'express'
}
```

### Customize your hasher method

By default, I use `pbkdf2` to encode and compare password hash.
In some case, you might need to change the way or algorithm to hash the
password.

#### Create new hasher class

This example uses `bcrypt` to hash and compare password phrase.

```typescript
import { Injectable } from '@nestjs/common'
import { compare, hash } from 'bcrypt'
import { PasswordHasherService } from './password-hasher.service'

@Injectable()
export class BcryptPasswordHasherService
  implements PasswordHasherService<string>
{
  public async hash(password: string): Promise<string> {
    return hash(password, 10)
  }

  public async compare(
    password: string,
    hashedPassword: string
  ): Promise<boolean> {
    return compare(password, hashedPassword)
  }
}
```

#### Register it to `AuthModule`

```typescript
AuthModule.forRootAsync({
  ...,
  passwordHasher: {
    useFactory: () => {
      return new BcryptPasswordHasherService()
    },
  }
})
```

#### Sample updated `CmsAuthRepository`

```typescript
import { Injectable } from '@nestjs/common'
import { ModuleRef } from '@nestjs/core'
import { mergeMap, Observable, of } from 'rxjs'
import {
  AuthDto,
  AuthRepository,
  IAuthUserEntity,
  InjectPasswordHasher,
  PasswordHasherService,
} from '@mercury-labs/nest-auth'

@Injectable()
export class SampleAuthRepository implements AuthRepository<IPbkdf2Hash, AuthDto> {
  /**
   * Your own throttle service
   * Sample demo
   */
  private _throttleAuthService: ThrottleAuthService

  public constructor(
    @InjectPasswordHasher()
    protected readonly hasher: PasswordHasherService,
    protected readonly moduleRef: ModuleRef
  ) {
  }

  public onModuleInit(): void {
    this._throttleAuthService = this.moduleRef.get(ThrottleAuthService)
  }

  public getAuthUserByUsername(
    username: string
  ): Observable<IAuthUserEntity<IPbkdf2Hash> | undefined> {
    return of({
      id: _.random(1, 1999).toString(),
      username: 'sample-user@gmail.com',
      email: 'sample-user@gmail.com',
      password: {
        hash: 'some-hash',
        salt: 'some-salt'
      },
    })
  }

  public authenticate(
    username: string,
    request: AuthDto,
    impersonated: boolean
  ): Observable<IAuthUserEntity<IPbkdf2Hash> | undefined> {
    /**
     * Ignore the other checks if impersonated
     */
    if (impersonated) {
      return this.getAuthUserByUsername(username)
    }

    /**
     * Do some additional logics
     */
    return this._throttleAuthService.checkAlreadyBlockedAccount(username).pipe(
      mergeMap(() => this.getAuthUserByUsername(username))
    )
  }

  public getAuthUserByAccessToken(
    accessToken: string,
    jwtPayload: IJwtPayload
  ): Observable<IAuthUserEntity<IPbkdf2Hash> | undefined> {
    /**
     * You can check the token if it's stored in database.
     */

    return this.getAuthUserByUsername(jwtPayload.username)
  }

  public getAuthUserByRefreshToken(
    refreshToken: string,
    jwtPayload: IJwtPayload
  ): Observable<IAuthUserEntity<IPbkdf2Hash> | undefined> {
    /**
     * You can check the token if it's stored in database.
     */

    return this.getAuthUserByUsername(jwtPayload.username)
  }
}
```

#### Access the login route

curl

```
curl --request POST \
  --url http://localhost:4005/auth/login \
  --header 'Content-Type: application/json' \
  --data '{
	"username": "sample-email+dev@gmail.com",
	"password": "some-password-phrase"
}'
```

#### Refresh your access token

curl

```
curl --request POST \
  --url http://localhost:4005/auth/refresh-token \
  --header 'Refresh-Token: eyJpdiI6IjFmNTY4ZWZmN2RmODRmZjkxNjQx...'
```

#### Get your logged in user profile

curl

```
curl --request GET \
  --url http://localhost:4005/auth/profile \
  --header 'Authorization: Bearer eyJpdiI6IjFmNTY4ZWZmN2RmODRmZjkxNjQx...'
```

#### Logout

curl

```
curl --request POST \
  --url http://localhost:4005/auth/logout
  --header 'Authorization: Bearer eyJpdiI6IjFmNTY4ZWZmN2RmODRmZjkxNjQx...'
```

### Injection Decorators

`@InjectAuthDefinitions()`: inject `IAuthDefinitions` to your injectable
classes.

`@InjectPasswordHasher()`: inject `PasswordHasherService` to your injectable
classes. This is an alias for the statement below:

```typescript
import { Inject, Injectable } from '@nestjs/common'
import { AUTH_PASSWORD_HASHER } from '@mercury-labs/nest-auth'

@Injectable()
export class SampleService {
  public constructor(
    @Inject(AUTH_PASSWORD_HASHER)
    protected readonly hasher: PasswordHasherService
  ) {}
}
```

### Controller Decorators

`@Public()` This decorator will help your controller available for all users. No
authentication required.

```typescript
import { Public } from '@mercury-labs/nest-auth'
import { Controller, Get } from '@nestjs/common'

@Controller()
@Public()
export class AppController {
  @Get()
  public getHello(): string {
    return 'Hello World!'
  }
}
```

`@InternalOnly()` You need to use basic auth while accessing your controller.

```typescript
import { InternalOnly } from '@mercury-labs/nest-auth'
import { Controller, Get } from '@nestjs/common'

@Controller()
@InternalOnly()
export class AppController {
  @Get()
  public getHello(): string {
    return 'Hello World!'
  }
}
```

`@AuthApiKey()` You need an `ApiKey` header while accessing your controller.

```typescript
import { AuthApiKey } from '@mercury-labs/nest-auth'
import { Controller, Get } from '@nestjs/common'

@Controller()
@AuthApiKey()
export class AppController {
  @Get()
  public getHello(): string {
    return 'Hello World!'
  }
}
```

**JWT**
By default, all another routes will be checked using JWT strategy guard.

It means, you need to pass your access token into the request header.

If you set the transfer method to `both` or `cookie`, you don't need to do
anything. The `Authorization` and `RefreshToken` already be sent via cookie.

If you set the transfer method to `bearer`, you need to pass your access token
to the `Authorization` header.

```
Authorization: Bearer {yourAccessToken}
Refesh-Token: {yourRefreshToken}
```

`@CurrentUser()` This decorator will return the current logged-in user.

```typescript
import { Controller, Get } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import {
  IAuthUserEntityForResponse,
  CurrentUser
} from '@mercury-labs/nest-auth'

@ApiTags('User details')
@Controller({path: 'users/-'})
export class ProfileController {
  @ApiOperation({
    summary: 'Get profile',
  })
  @Get('profile')
  public profile(
    @CurrentUser() user: IAuthUserEntityForResponse
  ): IAuthUserEntityForResponse {
    return user
  }
}
```

`@PublicWithOptionalUser()` Same as `@Public()`, but we can get user info
with `@CurrentUser()` if you pass your access token into the request header.

```typescript
import { PublicWithOptionalUser } from '@mercury-labs/nest-auth'
import { Controller, Get } from '@nestjs/common'

@Controller()
@PublicWithOptionalUser()
export class AppController {
  @Get()
  public getHello(
    @CurrentUser() user?: IAuthUserEntityForResponse | undefined
  ): string {
    /**
     * user is nullable
     */
    console.log({
      userId: user?.id
    })
    return 'Hello World!'
  }
}
```

## Triggered Events

### `UserLoggedInEvent`

Triggered when user logged in successfully.

You can store the relevant access/refresh tokens in database using this event.

#### Sample usages

```typescript
import { UserLoggedInEvent } from '@mercury-labs/nest-auth'
import { EventsHandler, IEventHandler } from '@nestjs/cqrs'
import { delay, lastValueFrom, of, tap } from 'rxjs'

@EventsHandler(UserLoggedInEvent)
export class UserLoggedInEventHandler implements IEventHandler<UserLoggedInEvent> {
  public async handle(event: UserLoggedInEvent): Promise<void> {
    await lastValueFrom(
      of(event).pipe(
        delay(1200),
        tap(({user, isImpersonated}) => {
          console.log('UserLoggedInEvent', {user, isImpersonated})
        })
      )
    )
  }
}
```

### `AccessTokenGeneratedFromRefreshTokenEvent`

Triggered when a new access token is generated from refresh token.

You can store the relevant new access token in database using this event.

#### Sample usages

```typescript
import { AccessTokenGeneratedFromRefreshTokenEvent } from '@mercury-labs/nest-auth'
import { EventsHandler, IEventHandler } from '@nestjs/cqrs'
import { delay, lastValueFrom, of, tap } from 'rxjs'

@EventsHandler(AccessTokenGeneratedFromRefreshTokenEvent)
export class AccessTokenGeneratedFromRefreshTokenEventHandler
  implements IEventHandler<AccessTokenGeneratedFromRefreshTokenEvent> {
  public async handle(event: AccessTokenGeneratedFromRefreshTokenEvent): Promise<void> {
    console.log('AccessTokenGeneratedFromRefreshTokenEvent', event)
  }
}
```

### `UserLoggedOutEvent`

Triggered when user logged out.

#### Sample usages

```typescript
import { UserLoggedOutEvent } from '@mercury-labs/nest-auth'
import { EventsHandler, IEventHandler } from '@nestjs/cqrs'
import { delay, lastValueFrom, of, tap } from 'rxjs'

@EventsHandler(UserLoggedOutEvent)
export class UserLoggedOutEventHandler implements IEventHandler<UserLoggedOutEvent> {
  public async handle(event: UserLoggedOutEvent): Promise<void> {
    console.log('UserLoggedOutEvent', event)
  }
}
```

#### Notes:

- You must install
  package [@nestjs/cqrs](https://www.npmjs.com/package/@nestjs/cqrs) to work
  with auth events.

## Next plan

- Allow user to revoke `accessToken`, `refreshToken` of some user.
