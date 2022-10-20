import { HashingModule } from '@mercury-labs/nest-hashing'
import {
  DynamicModule,
  InjectionToken,
  MiddlewareConsumer,
  Module,
  ModuleMetadata,
  NestModule,
  OptionalFactoryDependency,
  RequestMethod,
} from '@nestjs/common'
import { APP_GUARD, Reflector } from '@nestjs/core'
import { CqrsModule } from '@nestjs/cqrs'
import { JwtModule } from '@nestjs/jwt'
import {
  AUTH_PASSWORD_HASHER,
  AuthBasicGuard,
  AuthGlobalGuard,
  AuthRefreshTokenGuard,
  AuthRepository,
  GraphqlAuthJwtGuard, GraphqlAuthRefreshTokenGuard,
  IAuthDefinitions,
  JwtStrategy,
  LocalLoginAction,
  LocalStrategy,
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
  ClearAuthCookieInterceptor,
  CookieAuthInterceptor,
  LoginController,
  ProfileController,
  RefreshTokenController,
} from './presentation'
import { LogoutController } from './presentation/controllers/logout.controller'

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
  passwordHasher?: {
    useFactory: (
      ...args: any[]
    ) => Promise<PasswordHasherService> | PasswordHasherService
    inject?: Array<InjectionToken | OptionalFactoryDependency>
  }
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
              enabled: !!definitions.jwt && !!definitions.hashingSecretKey,
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
        LocalLoginAction,

        LocalStrategy,
        JwtStrategy,
        RefreshTokenStrategy,

        ClearAuthCookieInterceptor,
        CookieAuthInterceptor,

        AuthBasicGuard,
        AuthRefreshTokenGuard,
        GraphqlAuthJwtGuard,
        GraphqlAuthRefreshTokenGuard,

        BasicAuthMiddleware,

        {
          provide: APP_GUARD,
          useFactory: (
            reflector: Reflector,
            basicAuthGuard: AuthBasicGuard,
            refreshTokenGuard: AuthRefreshTokenGuard,
            graphqlAuthJwtGuard: GraphqlAuthJwtGuard,
            graphqlAuthRefreshTokenGuard: GraphqlAuthRefreshTokenGuard,
            options: IAuthDefinitions
          ) => {
            return new AuthGlobalGuard(
              reflector,
              basicAuthGuard,
              refreshTokenGuard,
              graphqlAuthJwtGuard,
              graphqlAuthRefreshTokenGuard,
              options
            )
          },
          inject: [
            Reflector,
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

        LocalLoginAction,

        AUTH_PASSWORD_HASHER,

        ClearAuthCookieInterceptor,
        CookieAuthInterceptor,
        LocalStrategy,
        JwtStrategy,
        RefreshTokenStrategy,

        HashingModule,
      ],
    }
  }

  public configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(BasicAuthMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL })
  }
}
