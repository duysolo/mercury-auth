import { DynamicModule, Module, ModuleMetadata, Provider } from '@nestjs/common'
import {
  InjectionToken
} from '@nestjs/common/interfaces/modules/injection-token.interface'
import {
  OptionalFactoryDependency
} from '@nestjs/common/interfaces/modules/optional-factory-dependency.interface'
import { IAuthDefinitions } from '../domain'

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
