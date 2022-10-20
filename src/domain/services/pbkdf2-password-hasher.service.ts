import { Injectable } from '@nestjs/common'
import crypto from 'crypto'
import { PasswordHasherService } from './password-hasher.service'

export interface IPbkdf2Hash {
  hash: string
  salt: string
}

@Injectable()
export class Pbkdf2PasswordHasherService
  implements PasswordHasherService<IPbkdf2Hash>
{
  public async hash(password: string): Promise<IPbkdf2Hash> {
    const salt = crypto.randomBytes(16).toString('hex')

    const hash = crypto
      .pbkdf2Sync(password, salt, 10000, 512, 'sha512')
      .toString('hex')

    return { salt, hash }
  }

  public async compare(
    password: string,
    hashedPassword: IPbkdf2Hash
  ): Promise<boolean> {
    const hashPassword = crypto
      .pbkdf2Sync(password, hashedPassword.salt, 10000, 512, 'sha512')
      .toString('hex')

    return hashedPassword.hash === hashPassword
  }
}
