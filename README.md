# Mercury Auth

### A comprehensive NestJS authentication module with multiple strategies

Mercury Auth is a flexible authentication module for NestJS applications that provides multiple authentication strategies:

1. **JWT Authentication** - Token-based authentication with access and refresh tokens
2. **API Key Authentication** - For server-to-server communication and integrations
3. **Basic Authentication** - For internal/admin routes
4. **Impersonation** - For debugging and support scenarios

#### Key Features

- Support for both `FastifyAdapter` and `ExpressAdapter`
- Flexible token delivery via cookies, headers, or both
- Refresh token rotation
- API Key authentication
- Role-based access control
- GraphQL support
- Event-driven architecture for auth events

## Install

```shell
npm install --save @mercury-labs/nest-auth
```

Learn more about the relevant
package [@mercury-labs/nest-hashing](https://www.npmjs.com/package/@mercury-labs/nest-hashing)

## Authentication Strategies Overview

Mercury Auth provides multiple authentication strategies that can be used independently or together:

### JWT Authentication (Default)

The primary authentication method using JSON Web Tokens:
- **Access Token**: Short-lived token for API access
- **Refresh Token**: Long-lived token to obtain new access tokens
- **Delivery Methods**: Bearer token in headers, cookies, or both

### API Key Authentication

Simple key-based authentication for server-to-server communication:
- Single token passed via the `Api-Key` header
- No expiration handling (managed by your application)
- Ideal for service accounts, integrations, and automated processes

### Basic Authentication

HTTP Basic Authentication for internal or admin routes:
- Username and password encoded in the `Authorization` header
- Configured via the `basicAuth` property in your auth definitions
- Applied using the `@InternalOnly()` decorator

### Impersonation

Allows administrators to log in as other users for support purposes:
- Special login format: `{cipher}username` with impersonation password
- Configurable via the `impersonate` property in your auth definitions
- Can be enabled/disabled as needed

## Authentication Flow

1. **Login**: User provides credentials and receives access and refresh tokens
2. **API Access**: User includes access token with requests
3. **Token Refresh**: When access token expires, user uses refresh token to get a new one
4. **Logout**: User invalidates their tokens

## Sample Applications

Complete sample applications demonstrating different adapters and configurations:

- [Fastify Sample](https://github.com/duysolo/mercury-auth-samples/tree/master/fastify)
- [Express Sample](https://github.com/duysolo/mercury-auth-samples/tree/master/express)
- [Apollo GraphQL Express Sample](https://github.com/duysolo/mercury-auth-samples/tree/master/apollo-graphql-express)

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
   * Hide some sensitive fields while getting user profile.
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

When your access token expires, you can use the refresh token to get a new access token without requiring the user to log in again. The refresh token has a longer expiration time than the access token (configured via `refreshTokenExpiresIn` in your JWT configuration).

##### Using the refresh token endpoint

The package provides a built-in endpoint for refreshing tokens at `/auth/refresh-token`. You need to include your refresh token in the request.

###### When using bearer token method:

```
curl --request POST \
  --url http://localhost:4005/auth/refresh-token \
  --header 'Refresh-Token: eyJpdiI6IjFmNTY4ZWZmN2RmODRmZjkxNjQx...'
```

###### When using cookie method:

The refresh token is automatically included in the cookie, so you just need to make the request:

```
curl --request POST \
  --url http://localhost:4005/auth/refresh-token \
  --cookie "refreshToken=eyJpdiI6IjFmNTY4ZWZmN2RmODRmZjkxNjQx..."
```

##### Response structure

The response will include a new access token but not a new refresh token:

```json
{
  "userData": {
    "id": "user-id",
    "username": "sample-user@gmail.com",
    "email": "sample-user@gmail.com"
  },
  "token": {
    "accessToken": "new-access-token",
    "expiryDate": "2023-01-01T00:00:00.000Z"
  }
}
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

`@AuthApiKey()` This decorator applies the API Key authentication guard to your controller or route. It requires an `Api-Key` header to be present in the request.

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

You can also apply the decorator to specific routes instead of the entire controller:

```typescript
import { AuthApiKey, CurrentUser } from '@mercury-labs/nest-auth'
import { Controller, Get } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'

@ApiTags('Authentication')
@Controller({ path: 'auth' })
export class ApiKeyController {
  @ApiOperation({
    summary: 'Get profile by API Key',
  })
  @AuthApiKey()
  @Get('profile/api-key')
  public profileByApiKey(
    @CurrentUser() user: IAuthUserEntityForResponse
  ): IAuthUserEntityForResponse {
    return user
  }

  // This route uses JWT authentication (default)
  @Get('profile')
  public profile(
    @CurrentUser() user: IAuthUserEntityForResponse
  ): IAuthUserEntityForResponse {
    return user
  }
}
```

`@AuthRefreshToken()` This decorator applies the refresh token guard to your controller or route. It's used internally by the refresh token endpoint.

```typescript
import { Controller, Post, UseInterceptors } from '@nestjs/common'
import { AuthRefreshToken, CurrentUserWithToken } from '@mercury-labs/nest-auth'
import { CookieAuthInterceptor } from '@mercury-labs/nest-auth'

@Controller({ path: 'auth' })
@AuthRefreshToken()
@UseInterceptors(CookieAuthInterceptor)
export class RefreshTokenController {
  @Post('refresh-token')
  public index(
    @CurrentUserWithToken() user: IAuthWithTokenResponse
  ): Observable<IRefreshTokenAuthResponse> {
    // Implementation to return a new access token
    // The refresh token is extracted from the request by the guard
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
Refresh-Token: {yourRefreshToken}
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

## API Key Authentication

Mercury Auth provides a robust API Key authentication strategy that allows clients to authenticate using an API key instead of JWT tokens. This is particularly useful for server-to-server communication, background jobs, or third-party integrations where the traditional username/password flow isn't appropriate.

### How API Key Authentication Works

1. The client includes an API key in the request header (`Api-Key`)
2. The `ApiKeyStrategy` extracts the API key from the request
3. The strategy calls the `getAuthUserByApiKey` method on your `AuthRepository` implementation
4. If a valid user is returned, the request is authenticated

### Implementing API Key Support

To implement API Key authentication, you need to:

1. Implement the `getAuthUserByApiKey` method in your `AuthRepository`:

```typescript
@Injectable()
export class YourAuthRepository implements AuthRepository<string, AuthDto> {
  // Other required methods...

  public async getAuthUserByApiKey(
    apiKey: string
  ): Promise<IAuthUserEntity | undefined> {
    // Validate the API key against your database or other storage
    const user = await this.userRepository.findByApiKey(apiKey);

    if (!user) {
      return undefined; // Invalid API key
    }

    return {
      id: user.id,
      username: user.email,
      email: user.email,
      // Other user properties
    };
  }
}
```

2. Apply the `@AuthApiKey()` decorator to controllers or routes that should accept API key authentication:

```typescript
@Controller('api')
@AuthApiKey()
export class ApiController {
  // All routes in this controller require API key authentication
}
```

### Generating and Managing API Keys

Mercury Auth doesn't provide built-in API key generation or management, as these are typically application-specific. Here's a recommended approach:

1. Create a service for generating and managing API keys:

```typescript
@Injectable()
export class ApiKeyService {
  constructor(
    @InjectRepository(ApiKeyEntity)
    private apiKeyRepository: Repository<ApiKeyEntity>,
  ) {}

  public async generateApiKey(userId: string, name: string): Promise<string> {
    // Generate a secure random API key
    const apiKey = crypto.randomUUID();

    // Store it in your database
    await this.apiKeyRepository.save({
      userId,
      name,
      key: apiKey,
      createdAt: new Date(),
    });

    return apiKey;
  }

  public async validateApiKey(apiKey: string): Promise<User | null> {
    const apiKeyRecord = await this.apiKeyRepository.findOne({
      where: { key: apiKey, isActive: true },
      relations: ['user'],
    });

    return apiKeyRecord?.user || null;
  }

  public async revokeApiKey(apiKeyId: string): Promise<void> {
    await this.apiKeyRepository.update(
      { id: apiKeyId },
      { isActive: false, revokedAt: new Date() }
    );
  }
}
```

2. Use this service in your `AuthRepository` implementation:

```typescript
@Injectable()
export class YourAuthRepository implements AuthRepository<string, AuthDto> {
  constructor(private apiKeyService: ApiKeyService) {}

  public async getAuthUserByApiKey(
    apiKey: string
  ): Promise<IAuthUserEntity | undefined> {
    const user = await this.apiKeyService.validateApiKey(apiKey);

    if (!user) {
      return undefined;
    }

    return {
      id: user.id,
      username: user.email,
      email: user.email,
      // Other user properties
    };
  }
}
```

### Testing API Key Authentication

You can test API key authentication using curl:

```bash
curl --request GET \
  --url http://localhost:4005/auth/profile/api-key \
  --header 'Api-Key: your-api-key-here'
```

### Security Best Practices for API Keys

1. **Generate Strong Keys**: Use a cryptographically secure random generator
2. **Store Securely**: Never store API keys in plaintext; use hashing
3. **Set Expirations**: Consider adding expiration dates to API keys
4. **Limit Scope**: Assign specific permissions to each API key
5. **Monitor Usage**: Log and monitor API key usage for suspicious activity
6. **Rotate Regularly**: Encourage or enforce regular key rotation

## Understanding Token Interfaces

### Token Response Interfaces

The package provides several interfaces for handling authentication responses:

```typescript
// Full authentication response with both access and refresh tokens
interface IAuthWithTokenResponse<UserDataType = IAuthUserEntityForResponse> {
  userData: UserDataType;
  token: IJwtTokenResponse;
}

// Response when refreshing tokens (no new refresh token)
interface IRefreshTokenAuthResponse<UserDataType = IAuthUserEntityForResponse> {
  userData: UserDataType;
  token: Omit<IJwtTokenResponse, 'refreshToken' | 'refreshTokenExpiryDate'>;
}

// JWT token response structure
interface IJwtTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiryDate: Date;
  refreshTokenExpiryDate: Date;
}
```

### Implementing Token Storage

For production applications, you should consider storing tokens in your database to enable features like:
- Token revocation
- Tracking active sessions
- Limiting concurrent logins

You can use the `UserLoggedInEvent` to store tokens when a user logs in:

```typescript
@EventsHandler(UserLoggedInEvent)
export class UserLoggedInEventHandler implements IEventHandler<UserLoggedInEvent> {
  constructor(private readonly tokenRepository: TokenRepository) {}

  public async handle(event: UserLoggedInEvent): Promise<void> {
    const { user, accessToken, refreshToken } = event;

    // Store tokens in your database
    await this.tokenRepository.saveTokens({
      userId: user.id,
      accessToken,
      refreshToken,
      // Add other metadata as needed
    });
  }
}
```

Then in your `AuthRepository` implementation, you can validate tokens against your database:

```typescript
public async getAuthUserByRefreshToken(
  refreshToken: string,
  jwtPayload: IJwtPayload
): Promise<IAuthUserEntity | undefined> {
  // Check if the token exists and is valid in your database
  const tokenRecord = await this.tokenRepository.findByRefreshToken(refreshToken);

  if (!tokenRecord || tokenRecord.isRevoked) {
    return undefined;
  }

  // Get the user associated with this token
  return this.getAuthUserByUsername(jwtPayload.username);
}
```

## Authentication Guards

Mercury Auth uses a global guard system that automatically applies the appropriate authentication strategy based on route decorators. Here's how the guards work together:

### Global Guard

The `AuthGlobalGuard` is registered as a global guard and determines which specific guard to apply based on route decorators:

```typescript
@Injectable()
export class AuthGlobalGuard implements CanActivate {
  // ...

  public canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    // Check if route is public
    const isPublic = this._reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (isPublic) {
      return true; // Allow access without authentication
    }

    // Check if route is internal only (basic auth)
    const isInternalOnly = this._reflector.getAllAndOverride<boolean>(IS_INTERNAL_ONLY, [
      context.getHandler(),
      context.getClass()
    ])

    if (isInternalOnly) {
      return this._basicAuthGuard.canActivate(context);
    }

    // Check if route requires API key
    const isApiKey = this._reflector.getAllAndOverride<boolean>(IS_API_KEY, [
      context.getHandler(),
      context.getClass()
    ])

    if (isApiKey) {
      return this._authApiKeyGuard.canActivate(context);
    }

    // Check if route is for refresh token
    const isRefreshToken = this._reflector.getAllAndOverride<boolean>(IS_REFRESH_TOKEN_KEY, [
      context.getHandler(),
      context.getClass()
    ])

    if (isRefreshToken) {
      return this._refreshTokenGuard.canActivate(context);
    }

    // Default to JWT authentication
    return this._jwtGuard.canActivate(context);
  }
}
```

### Guard Priority

When multiple decorators are applied, the guards are evaluated in this order:

1. `@Public()` - No authentication required
2. `@InternalOnly()` - Basic authentication
3. `@AuthApiKey()` - API Key authentication
4. `@AuthRefreshToken()` - Refresh token authentication
5. Default - JWT authentication

### GraphQL Support

Mercury Auth provides GraphQL-specific guards that work with the NestJS GraphQL module:

- `GraphqlAuthJwtGuard`
- `GraphqlAuthRefreshTokenGuard`
- `GraphqlAuthApiKeyGuard`

These guards extract authentication data from the GraphQL context instead of HTTP requests.

## Next plan

- Allow user to revoke `accessToken`, `refreshToken` of some user.
- Add support for token blacklisting
- Implement token rotation for enhanced security
- Add support for OAuth2 authentication providers
