import { CqrsModule } from '@nestjs/cqrs'
import { Test, TestingModule } from '@nestjs/testing'
import { AuthModule } from '../../auth.module'
import {
  AUTH_PASSWORD_HASHER,
  AuthTransferTokenMethod,
  PasswordHasherService,
} from '../../domain'
import { IAuthDefinitions, LocalAuthRepository } from '../../infrastructure'

export const defaultAuthDefinitionsFixture: IAuthDefinitions = {
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
    secret: 'AUTH_JWT_SECRET',
    expiresIn: '1d',
  },
  transferTokenMethod: AuthTransferTokenMethod.BEARER_ONLY,
  redactedFields: ['password'],
  hashingSecretKey: 'LqeRsYk5d82mgYFKujl34e8DxvHMrB5T',
  usernameField: 'username',
  passwordField: 'password',
  httpAdaptorType: 'fastify',
}

export async function createTestAuthModule(
  defaultDefinitions: IAuthDefinitions
): Promise<TestingModule> {
  return await Test.createTestingModule({
    imports: [
      CqrsModule,
      AuthModule.forRootAsync({
        definitions: {
          useFactory: () => defaultDefinitions,
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
