import { Injectable } from '@nestjs/common'
import _ from 'lodash/fp'
import {
  AuthDto,
  AuthRepository,
  IAuthUserEntity,
  IJwtPayload,
  InjectPasswordHasher,
  PasswordHasherService,
} from '../../domain'

@Injectable()
export class SampleAuthPromiseRepository implements AuthRepository<string, AuthDto> {
  public constructor(
    @InjectPasswordHasher()
    protected readonly hasher: PasswordHasherService
  ) {}

  public async getAuthUserByUsername(
    username: string
  ): Promise<IAuthUserEntity | undefined> {
    return {
      id: _.random(1, 1999).toString(),
      username: 'sample-user@gmail.com',
      email: 'sample-user@gmail.com',
      password: await this.hasher.hash('testLogin@12345'),
    }
  }

  public async authenticate(
    username: string,
    request: AuthDto,
    impersonated: boolean
  ): Promise<IAuthUserEntity | undefined> {
    const user = await this.getAuthUserByUsername(username)

    if (impersonated) {
      return user
    }

    /**
     * Do some additional logics
     */

    return user
  }

  public async getAuthUserByAccessToken(
    accessToken: string,
    jwtPayload: IJwtPayload
  ): Promise<IAuthUserEntity | undefined> {
    /**
     * You can check the token if it's stored in database.
     */

    return this.getAuthUserByUsername(jwtPayload.username)
  }

  public async getAuthUserByRefreshToken(
    refreshToken: string,
    jwtPayload: IJwtPayload
  ): Promise<IAuthUserEntity | undefined> {
    /**
     * You can check the token if it's stored in database.
     */

    return this.getAuthUserByUsername(jwtPayload.username)
  }
}
