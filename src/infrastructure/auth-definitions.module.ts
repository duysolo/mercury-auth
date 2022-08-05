import { DynamicModule, Module, ModuleMetadata, Provider } from '@nestjs/common'
import { InjectionToken } from '@nestjs/common/interfaces/modules/injection-token.interface'
import { OptionalFactoryDependency } from '@nestjs/common/interfaces/modules/optional-factory-dependency.interface'
import { AuthTransferTokenMethod, ICookieSerializeOptions } from '../domain'

export interface IAuthDefinitions {
  basicAuth: {
    username: string
    password: string
    realm?: string
  }

  jwt: {
    secret: string
    expiresIn: string | number
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
    'domain' | 'path' | 'sameSite' | 'signed' | 'httpOnly'
  >

  usernameField?: string
  passwordField?: string

  httpAdaptorType: 'fastify' | 'express'
}

export type IAuthDefinitionsModuleOptions = Pick<ModuleMetadata, 'imports'> & {
  useFactory: (...args: any[]) => Promise<IAuthDefinitions> | IAuthDefinitions
  inject?: Array<InjectionToken | OptionalFactoryDependency>
}

export const AUTH_DEFINITIONS_MODULE_OPTIONS: symbol = Symbol(
  'AUTH_DEFINITIONS_MODULE_OPTIONS'
)

@Module({})
export class AuthDefinitionsModule {
  public static forRootAsync(
    options: IAuthDefinitionsModuleOptions
  ): DynamicModule {
    const authModuleProvider: Provider = {
      provide: AUTH_DEFINITIONS_MODULE_OPTIONS,
      useFactory: options.useFactory,
      inject: options.inject,
    }

    return {
      module: AuthDefinitionsModule,
      providers: [authModuleProvider],
      exports: [AUTH_DEFINITIONS_MODULE_OPTIONS],
      imports: options.imports || [],
      global: true,
    }
  }
}
