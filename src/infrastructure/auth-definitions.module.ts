import {
  DynamicModule,
  Module,
  ModuleMetadata,
  Provider,
  Type,
} from '@nestjs/common'
import { AuthTransferTokenMethod } from '../domain/definitions'

export interface IAuthDefinitions {
  basicAuth: {
    username: string
    password: string
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

  transferTokenMethod: AuthTransferTokenMethod

  usernameField?: string
  passwordField?: string

  httpAdaptorType: 'fastify' | 'express'
}

export type IAuhDefinitionsModuleOptions = Pick<ModuleMetadata, 'imports'> & {
  useFactory: (...args: any[]) => Promise<IAuthDefinitions> | IAuthDefinitions
  inject?: Type[]
}

export const AUTH_DEFINITIONS_MODULE_OPTIONS: symbol = Symbol(
  'AUTH_DEFINITIONS_MODULE_OPTIONS'
)

@Module({})
export class AuthDefinitionsModule {
  public static forRootAsync(
    options: IAuhDefinitionsModuleOptions
  ): DynamicModule {
    const authModuleProvider: Provider = {
      provide: AUTH_DEFINITIONS_MODULE_OPTIONS,
      useFactory: options.useFactory,
      inject: options.inject,
    }

    return {
      module: AuthDefinitionsModule,
      providers: [authModuleProvider],
      exports: [authModuleProvider],
      imports: [...(options.imports || [])],
      global: true,
    }
  }
}
