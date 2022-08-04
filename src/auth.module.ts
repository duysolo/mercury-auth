import { HashingModule } from '@mercury-labs/hashing'
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
import { APP_GUARD } from '@nestjs/core'
import { CqrsModule } from '@nestjs/cqrs'
import { JwtModule } from '@nestjs/jwt'
import {
  AUTH_PASSWORD_HASHER,
  AuthBasicGuard,
  AuthenticationService,
  AuthGlobalGuard,
  AuthRefreshTokenGuard,
  AuthRepository,
  BcryptPasswordHasherService,
  JwtStrategy,
  LocalLoginAction,
  LocalStrategy,
  PasswordHasherService,
  RefreshTokenStrategy,
} from './domain'
import {
  AUTH_DEFINITIONS_MODULE_OPTIONS,
  AuthDefinitionsModule,
  IAuthDefinitions,
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
  authRepository: {
    useFactory: (...args: any[]) => Promise<AuthRepository> | AuthRepository
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
            }
          },
          inject: [AUTH_DEFINITIONS_MODULE_OPTIONS],
        }),
        JwtModule.registerAsync({
          useFactory: (definitions: IAuthDefinitions) => {
            return {
              secret: definitions.jwt.secret,
              signOptions: {
                expiresIn: definitions.jwt.expiresIn,
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
            (() => new BcryptPasswordHasherService()),
          inject: options.passwordHasher?.inject,
        },

        {
          provide: AuthRepository,
          useFactory: options.authRepository.useFactory,
          inject: options.authRepository.inject || [],
        },

        {
          provide: APP_GUARD,
          useClass: AuthGlobalGuard,
        },

        AuthenticationService,
        LocalLoginAction,

        LocalStrategy,
        JwtStrategy,
        RefreshTokenStrategy,

        AuthBasicGuard,
        AuthRefreshTokenGuard,

        ClearAuthCookieInterceptor,
        CookieAuthInterceptor,

        ...(options.providers || []),
      ],
      controllers: [
        LoginController,
        RefreshTokenController,
        LogoutController,
        ProfileController,
      ],
      exports: [
        AuthRepository,
        AuthenticationService,

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
