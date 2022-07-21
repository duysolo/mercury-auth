import { HashingModule } from '@mercury-labs/hashing'
import {
  DynamicModule,
  MiddlewareConsumer,
  Module,
  ModuleMetadata,
  NestModule,
  RequestMethod,
} from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { JwtModule } from '@nestjs/jwt'
import {
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
import {
  AUTH_DEFINITIONS_MODULE_OPTIONS,
  AuthDefinitionsModule,
  BasicAuthMiddleware,
  IAuhDefinitionsModuleOptions,
  IAuthDefinitions,
  LocalAuthRepository,
} from './infrastructure'
import {
  ClearAuthCookieInterceptor,
  CookieAuthInterceptor,
  LoginController,
  ProfileController,
  RefreshTokenController,
} from './presentation'
import { LogoutController } from './presentation/controllers/logout.controller'

export interface IAuthModuleOptions extends Pick<ModuleMetadata, 'imports' | 'providers'> {
  definitions: IAuhDefinitionsModuleOptions
}

@Module({})
export class AuthModule implements NestModule {
  public static forRootAsync(options: IAuthModuleOptions): DynamicModule {
    return {
      module: AuthModule,
      providers: [
        {
          provide: AuthRepository,
          useClass: LocalAuthRepository,
        },
        {
          provide: PasswordHasherService,
          useClass: BcryptPasswordHasherService,
        },

        {
          provide: APP_GUARD,
          useClass: AuthGlobalGuard,
        },

        AuthenticationService,

        LocalStrategy,
        JwtStrategy,
        RefreshTokenStrategy,

        LoginAction,

        AuthBasicGuard,
        AuthRefreshTokenGuard,

        ClearAuthCookieInterceptor,
        CookieAuthInterceptor,

        ...(options.providers || []),
      ],
      imports: [
        ...(options.imports || []),
        HashingModule,
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
      controllers: [
        LoginController,
        RefreshTokenController,
        LogoutController,
        ProfileController,
      ],
      exports: [AuthenticationService, PasswordHasherService],
    }
  }

  public configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(BasicAuthMiddleware)
      .forRoutes({path: '*', method: RequestMethod.ALL})
  }
}
