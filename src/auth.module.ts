import {
  DynamicModule,
  InjectionToken,
  MiddlewareConsumer,
  Module,
  ModuleMetadata,
  NestModule,
  OptionalFactoryDependency,
  Provider,
  RequestMethod,
} from '@nestjs/common'
import { APP_GUARD, Reflector } from '@nestjs/core'
import { CqrsModule } from '@nestjs/cqrs'
import { JwtModule } from '@nestjs/jwt'
import {
  LoginCommandHandler,
  UserLogoutCommandHandler,
} from './application/actions/handlers'
import {
  GetCurrentUserByAccessTokenQueryHandler,
  GetCurrentUserByApiKeyQueryHandler,
  GetCurrentUserByRefreshTokenQueryHandler,
} from './application/queries/handlers'
import {
  ApiKeyStrategy,
  AUTH_PASSWORD_HASHER,
  AuthApiKeyGuard,
  AuthBasicGuard,
  AuthGlobalGuard,
  AuthJwtGuard,
  AuthRefreshTokenGuard,
  AuthRepository,
  GetUserByApiKeyAction,
  GetUserByJwtTokenAction,
  GetUserByRefreshTokenAction,
  GraphqlAuthApiKeyGuard,
  GraphqlAuthJwtGuard,
  GraphqlAuthRefreshTokenGuard,
  IAuthDefinitions,
  JwtStrategy,
  LocalLoginAction,
  LocalStrategy,
  LogoutAction,
  ParseJwtTokenAction,
  PasswordHasherService,
  Pbkdf2PasswordHasherService,
  RefreshTokenStrategy,
  TokenService,
} from './domain'
import { HashingModule } from './hashing.module'
import {
  AUTH_DEFINITIONS_MODULE_OPTIONS,
  AuthDefinitionsModule,
  IAuthDefinitionsModuleOptions,
} from './infrastructure'
import {
  BasicAuthMiddleware,
  CookieAuthInterceptor,
  LoginController,
  LogoutController,
  ProfileController,
  RefreshTokenController,
  UserLogoutInterceptor,
} from './presentation'

export interface IAuthModuleOptions
  extends Pick<ModuleMetadata, 'imports' | 'providers'> {
  definitions: IAuthDefinitionsModuleOptions
  useLocalAuth?: boolean
  authRepository?: {
    useFactory: (
      ...args: any[]
    ) => Promise<AuthRepository<any>> | AuthRepository<any>
    inject?: Array<InjectionToken | OptionalFactoryDependency>
  }
  otherProviders?: Provider[]
  passwordHasher?: {
    useFactory: (
      ...args: any[]
    ) => Promise<PasswordHasherService> | PasswordHasherService
    inject?: Array<InjectionToken | OptionalFactoryDependency>
  }
  global?: boolean
}

@Module({})
export class AuthModule implements NestModule {
  public static forRootAsync(options: IAuthModuleOptions): DynamicModule {
    const useLocalAuth =
      typeof options.useLocalAuth === 'undefined' || options.useLocalAuth

    return {
      module: AuthModule,
      imports: [
        ...(options.imports || []),
        CqrsModule,
        AuthDefinitionsModule.forRootAsync(options.definitions),
        HashingModule.forRootAsync({
          useFactory: (definitions: IAuthDefinitions) => {
            return {
              secretKey: definitions.hashingSecretKey,
              enabled: definitions.enableHashingToken,
            }
          },
          inject: [AUTH_DEFINITIONS_MODULE_OPTIONS],
        }),
        JwtModule.registerAsync({
          useFactory: (definitions: IAuthDefinitions) => {
            return {
              secret: definitions.jwt?.secret,
              signOptions: {
                expiresIn: definitions.jwt?.expiresIn,
              },
            }
          },
          inject: [AUTH_DEFINITIONS_MODULE_OPTIONS],
        }),
      ],
      providers: [
        ...(options.otherProviders || []),

        {
          provide: AUTH_PASSWORD_HASHER,
          useFactory:
            options.passwordHasher?.useFactory ||
            (() => new Pbkdf2PasswordHasherService()),
          inject: options.passwordHasher?.inject,
        },

        {
          provide: AuthRepository,
          useFactory: options.authRepository?.useFactory
            ? options.authRepository.useFactory
            : () => {},
          inject: options.authRepository?.inject || [],
        },

        TokenService,

        LoginCommandHandler,
        GetCurrentUserByAccessTokenQueryHandler,
        GetCurrentUserByApiKeyQueryHandler,
        GetCurrentUserByRefreshTokenQueryHandler,
        UserLogoutCommandHandler,

        GetUserByJwtTokenAction,
        GetUserByApiKeyAction,
        GetUserByRefreshTokenAction,
        LocalLoginAction,
        ParseJwtTokenAction,
        LogoutAction,

        LocalStrategy,
        ApiKeyStrategy,
        JwtStrategy,
        RefreshTokenStrategy,

        UserLogoutInterceptor,
        CookieAuthInterceptor,

        AuthBasicGuard,
        AuthApiKeyGuard,
        AuthJwtGuard,
        AuthRefreshTokenGuard,
        GraphqlAuthJwtGuard,
        GraphqlAuthRefreshTokenGuard,
        GraphqlAuthApiKeyGuard,

        BasicAuthMiddleware,

        {
          provide: APP_GUARD,
          useFactory: (
            reflector: Reflector,
            authJwtGuard: AuthJwtGuard,
            basicAuthGuard: AuthBasicGuard,
            authApiKeyGuard: AuthApiKeyGuard,
            refreshTokenGuard: AuthRefreshTokenGuard,
            graphqlAuthJwtGuard: GraphqlAuthJwtGuard,
            graphqlAuthRefreshTokenGuard: GraphqlAuthRefreshTokenGuard,
            options: IAuthDefinitions
          ) => {
            return new AuthGlobalGuard(
              reflector,
              authJwtGuard,
              basicAuthGuard,
              authApiKeyGuard,
              refreshTokenGuard,
              graphqlAuthJwtGuard,
              graphqlAuthRefreshTokenGuard,
              options
            )
          },
          inject: [
            Reflector,
            AuthJwtGuard,
            AuthBasicGuard,
            AuthApiKeyGuard,
            AuthRefreshTokenGuard,
            GraphqlAuthJwtGuard,
            GraphqlAuthRefreshTokenGuard,
            AUTH_DEFINITIONS_MODULE_OPTIONS,
          ],
        },

        ...(options.providers || []),
      ],
      controllers: useLocalAuth
        ? [
            LoginController,
            RefreshTokenController,
            LogoutController,
            ProfileController,
          ]
        : [],
      exports: [
        AuthRepository,
        TokenService,

        GetUserByJwtTokenAction,
        GetUserByApiKeyAction,
        GetUserByRefreshTokenAction,
        LocalLoginAction,
        ParseJwtTokenAction,
        LogoutAction,

        AUTH_PASSWORD_HASHER,

        UserLogoutInterceptor,
        CookieAuthInterceptor,

        LocalStrategy,
        JwtStrategy,
        RefreshTokenStrategy,

        LoginCommandHandler,
        UserLogoutCommandHandler,
        GetCurrentUserByAccessTokenQueryHandler,
        GetCurrentUserByRefreshTokenQueryHandler,

        HashingModule,

        ...(options.otherProviders || []),
      ],
      global: options.global || false,
    }
  }

  public configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(BasicAuthMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL })
  }
}
