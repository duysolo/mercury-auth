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
  GetCurrentUserByAccessTokenQueryHandler,
  GetCurrentUserByRefreshTokenQueryHandler,
} from './application/queries/handlers'
import {
  AUTH_PASSWORD_HASHER,
  AuthBasicGuard,
  AuthGlobalGuard,
  AuthJwtGuard,
  AuthRefreshTokenGuard,
  AuthRepository,
  GetUserByJwtTokenAction,
  GetUserByRefreshTokenAction,
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
import {
  AUTH_DEFINITIONS_MODULE_OPTIONS,
  AuthDefinitionsModule,
  IAuthDefinitionsModuleOptions,
} from './infrastructure'
import {
  BasicAuthMiddleware,
  UserLogoutInterceptor,
  CookieAuthInterceptor,
  LoginController,
  ProfileController,
  RefreshTokenController,
} from './presentation'
import { LogoutController } from './presentation/controllers/logout.controller'
import { HashingModule } from './hashing.module'
import {
  LoginCommandHandler,
  UserLogoutCommandHandler,
} from './application/actions/handlers'

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
        GetCurrentUserByRefreshTokenQueryHandler,
        UserLogoutCommandHandler,

        GetUserByJwtTokenAction,
        GetUserByRefreshTokenAction,
        LocalLoginAction,
        ParseJwtTokenAction,
        LogoutAction,

        LocalStrategy,
        JwtStrategy,
        RefreshTokenStrategy,

        UserLogoutInterceptor,
        CookieAuthInterceptor,

        AuthBasicGuard,
        AuthJwtGuard,
        AuthRefreshTokenGuard,
        GraphqlAuthJwtGuard,
        GraphqlAuthRefreshTokenGuard,

        BasicAuthMiddleware,

        {
          provide: APP_GUARD,
          useFactory: (
            reflector: Reflector,
            authJwtGuard: AuthJwtGuard,
            basicAuthGuard: AuthBasicGuard,
            refreshTokenGuard: AuthRefreshTokenGuard,
            graphqlAuthJwtGuard: GraphqlAuthJwtGuard,
            graphqlAuthRefreshTokenGuard: GraphqlAuthRefreshTokenGuard,
            options: IAuthDefinitions
          ) => {
            return new AuthGlobalGuard(
              reflector,
              authJwtGuard,
              basicAuthGuard,
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
