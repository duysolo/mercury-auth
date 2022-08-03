import { INestApplication } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify'
import { Test } from '@nestjs/testing'
import { TestingModule } from '@nestjs/testing/testing-module'
import cookieParser from 'cookie-parser'
import { AuthModule } from '../../auth.module'
import {
  AUTH_PASSWORD_HASHER,
  AuthTransferTokenMethod,
  PasswordHasherService,
} from '../../domain'
import { IAuthDefinitions, LocalAuthRepository } from '../../infrastructure'
import FastifyCookie from '@fastify/cookie'

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
    },
    transferTokenMethod: AuthTransferTokenMethod.BEARER_ONLY,
    redactedFields: ['password'],
    hashingSecretKey: 'LqeRsYk5d82mgYFKujl34e8DxvHMrB5T',
    usernameField: 'username',
    passwordField: 'password',
    httpAdaptorType: 'fastify',
    ...(options || {}),
  }
}

export async function createTestAuthApplicationExpress(
  defaultDefinitions: IAuthDefinitions
): Promise<INestApplication> {
  const moduleFixture = await createTestingModule(defaultDefinitions)

  const app = moduleFixture.createNestApplication()

  app.enableCors({
    credentials: true,
    origin: false,
  })

  if (
    [
      AuthTransferTokenMethod.BOTH,
      AuthTransferTokenMethod.COOKIE_ONLY,
    ].includes(defaultDefinitions.transferTokenMethod)
  ) {
    app.use(cookieParser())
  }

  return app
}

export async function createTestAuthApplicationFastify(
  defaultDefinitions: IAuthDefinitions
): Promise<NestFastifyApplication> {
  const moduleFixture = await createTestingModule(defaultDefinitions)

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
    ].includes(defaultDefinitions.transferTokenMethod)
  ) {
    app.getHttpAdapter().getInstance().register(FastifyCookie)
  }

  return app
}

export async function createTestingModule(
  definitions: IAuthDefinitions
): Promise<TestingModule> {
  return await Test.createTestingModule({
    imports: [
      CqrsModule,
      AuthModule.forRootAsync({
        definitions: {
          useFactory: () => definitions,
        },
        authRepository: {
          useFactory: (hasher: PasswordHasherService) => {
            return new LocalAuthRepository(hasher)
          },
          inject: [AUTH_PASSWORD_HASHER],
        },
      }),
    ],
  }).compile()
}
