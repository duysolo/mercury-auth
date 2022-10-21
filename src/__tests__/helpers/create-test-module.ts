import FastifyCookie from '@fastify/cookie'
import { INestApplication } from '@nestjs/common'
import { ModuleMetadata } from '@nestjs/common/interfaces/modules/module-metadata.interface'
import { CqrsModule, EventsHandler, IEventHandler } from '@nestjs/cqrs'
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify'
import { Test } from '@nestjs/testing'
import { TestingModule } from '@nestjs/testing/testing-module'
import cookieParser from 'cookie-parser'
import { AuthModule, IAuthModuleOptions } from '../../auth.module'
import {
  AUTH_PASSWORD_HASHER,
  AuthTransferTokenMethod,
  IAuthDefinitions,
  PasswordHasherService,
  UserLoggedInEvent,
} from '../../domain'
import { SampleAuthRepository } from './sample.auth.repository'

export const defaultAuthDefinitionsFixture: (
  options?: Partial<IAuthDefinitions>
) => IAuthDefinitions = (options) => {
  return {
    basicAuth: {
      username: 'BASIC_AUTH_USER',
      password: 'BASIC_AUTH_PASSWORD',
    },
    impersonate: {
      isEnabled: true,
      cipher: 'AUTH_IMPERSONATE_CIPHER',
      password: 'AUTH_IMPERSONATE_PASSWORD',
    },
    jwt: {
      secret: 'jugTLY7xOuhcLu5OCH9WIFAStLeXZmyH',
      expiresIn: '1d',
      refreshTokenExpiresIn: '1d',
    },
    transferTokenMethod: AuthTransferTokenMethod.BOTH,
    redactedFields: ['password'],
    hashingSecretKey: 'LqeRsYk5d82mgYFKujl34e8DxvHMrB5T',
    usernameField: 'username',
    passwordField: 'password',
    httpAdaptorType: 'fastify',
    ...(options || {}),
  }
}

@EventsHandler(UserLoggedInEvent)
export class UserLoggedInEventHandler implements IEventHandler {
  public async handle(event: UserLoggedInEvent): Promise<void> {}
}

export async function createTestAuthApplicationExpress(
  definitions: IAuthDefinitions
): Promise<INestApplication> {
  const moduleFixture = await createTestingModule(
    definitions,
    {},
    {
      providers: [UserLoggedInEventHandler],
    }
  )

  const app = moduleFixture.createNestApplication()

  app.enableCors({
    credentials: true,
    origin: false,
  })

  if (
    [
      AuthTransferTokenMethod.BOTH,
      AuthTransferTokenMethod.COOKIE_ONLY,
    ].includes(
      definitions.transferTokenMethod as unknown as AuthTransferTokenMethod
    )
  ) {
    app.use(cookieParser())
  }

  return app
}

export async function createTestAuthApplicationFastify(
  defaultDefinitions: IAuthDefinitions
): Promise<NestFastifyApplication> {
  const moduleFixture = await createTestingModule(
    defaultDefinitions,
    {},
    {
      providers: [UserLoggedInEventHandler],
    }
  )

  const app: NestFastifyApplication = moduleFixture.createNestApplication(
    new FastifyAdapter()
  )

  app.enableCors({
    credentials: true,
    origin: false,
  })

  if (
    [
      AuthTransferTokenMethod.BOTH,
      AuthTransferTokenMethod.COOKIE_ONLY,
    ].includes(
      defaultDefinitions.transferTokenMethod as unknown as AuthTransferTokenMethod
    )
  ) {
    app.getHttpAdapter().getInstance().register(FastifyCookie)
  }

  return app
}

export async function createTestingModule(
  definitions: IAuthDefinitions,
  otherOptions: Partial<Omit<IAuthModuleOptions, 'definitions'>> = {},
  testModuleMetadata: ModuleMetadata = {}
): Promise<TestingModule> {
  if (!otherOptions.authRepository) {
    otherOptions.authRepository = {
      useFactory: (hasher: PasswordHasherService) => {
        return new SampleAuthRepository(hasher)
      },
      inject: [AUTH_PASSWORD_HASHER],
    }
  }

  return await Test.createTestingModule({
    imports: [
      CqrsModule,
      AuthModule.forRootAsync({
        definitions: {
          useFactory: () => definitions,
        },
        ...(otherOptions as any),
      }),
      ...(testModuleMetadata.imports || []),
    ],
    providers: testModuleMetadata.providers || [],
    controllers: testModuleMetadata.controllers || [],
  }).compile()
}
