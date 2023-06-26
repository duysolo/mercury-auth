import { DynamicModule, Module, Provider } from '@nestjs/common'
import { ModuleMetadata } from '@nestjs/common/interfaces'
import { HashTextService } from './index'

const HASHING_MODULE_OPTIONS: symbol = Symbol('HASHING_MODULE_OPTIONS')

export interface IHashingOptions {
  secretKey?: string
  enabled?: boolean
}

export type HashingModuleOptionsAsync = Pick<ModuleMetadata, 'imports'> & {
  useFactory: (...args: any[]) => Promise<IHashingOptions> | IHashingOptions
  inject?: any[]
  global?: boolean
}

@Module({})
export class HashingModule {
  public static forRoot(
    options: IHashingOptions & { global?: boolean }
  ): DynamicModule {
    const { enabled = true } = options

    return {
      module: HashingModule,
      providers: enabled
        ? [
          {
            provide: HashTextService,
            useValue: new HashTextService({ ...options, enabled }),
          },
        ]
        : [],
      exports: [HashTextService],
      global: options.global || false,
    }
  }

  public static forRootAsync(
    options: HashingModuleOptionsAsync
  ): DynamicModule {
    const hashModuleProvider: Provider = {
      provide: HASHING_MODULE_OPTIONS,
      useFactory: options.useFactory,
      inject: options.inject || [],
    }

    const hashTextProvider: Provider = {
      provide: HashTextService,
      useFactory: (options: IHashingOptions) => {
        const { enabled = true } = options

        return enabled ? new HashTextService({
          ...options,
          enabled
        }) : undefined
      },
      inject: [HASHING_MODULE_OPTIONS],
    }

    return {
      module: HashingModule,
      imports: [...(options.imports || [])],
      providers: [hashModuleProvider, hashTextProvider],
      exports: [HashTextService],
      global: options.global || false,
    }
  }
}
