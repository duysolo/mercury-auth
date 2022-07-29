import {
  HashingModule,
  HashingModuleOptionsAsync,
  HashTextService,
} from '@mercury-labs/hashing'
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
import { JwtModule, JwtService } from '@nestjs/jwt'
import {
  AUTH_DEFINITIONS_MODULE_OPTIONS,
  AuthDefinitionsModule,
  IAuthDefinitions,
  IAuthDefinitionsModuleOptions,
} from './auth-definitions.module'
import {
  AUTH_PASSWORD_HASHER,
  AuthBasicGuard,
  AuthenticationService,
  AuthGlobalGuard,
  AuthRefreshTokenGuard,
  AuthRepository,
  BcryptPasswordHasherService,
  JwtStrategy,
  LocalStrategy,
  LoginAction,
  PasswordHasherService,
  RefreshTokenStrategy,
} from './domain'
import { BasicAuthMiddleware, LocalAuthRepository } from './infrastructure'
import {
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
  hashing: Omit<HashingModuleOptionsAsync, 'global'>
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
        HashingModule.forRootAsync(options.hashing),
        AuthDefinitionsModule.forRootAsync(options.definitions),
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
          imports: [AuthDefinitionsModule],
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
          useFactory:
            options.authRepository.useFactory ||
            ((hasher: PasswordHasherService) =>
              new LocalAuthRepository(hasher)),
          inject: options.authRepository.inject || [AUTH_PASSWORD_HASHER],
        },

        {
          provide: APP_GUARD,
          useClass: AuthGlobalGuard,
        },

        {
          provide: AuthenticationService,
          useFactory: (
            jwtService: JwtService,
            hashTextService: HashTextService,
            authDefinitions: IAuthDefinitions
          ) => {
            return new AuthenticationService(
              jwtService,
              hashTextService,
              authDefinitions
            )
          },
          inject: [
            JwtService,
            HashTextService,
            AUTH_DEFINITIONS_MODULE_OPTIONS,
          ],
        },

        LocalStrategy,
        JwtStrategy,
        RefreshTokenStrategy,

        {
          provide: LoginAction,
          useFactory: (
            definitions: IAuthDefinitions,
            authRepository: AuthRepository,
            passwordHasher: PasswordHasherService
          ) => {
            return new LoginAction(definitions, authRepository, passwordHasher)
          },
          inject: [
            AUTH_DEFINITIONS_MODULE_OPTIONS,
            AuthRepository,
            AUTH_PASSWORD_HASHER,
          ],
        },

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
