import { Injectable } from '@nestjs/common'
import { compare, hash } from 'bcrypt'

export const AUTH_PASSWORD_HASHER: symbol = Symbol('AUTH_PASSWORD_HASHER')

export abstract class PasswordHasherService<T = any> {
  public abstract hash(password: string): Promise<T>

  public abstract compare(password: string, hashedPassword: T): Promise<boolean>
}

@Injectable()
export class BcryptPasswordHasherService
  implements PasswordHasherService<string>
{
  public async hash(password: string): Promise<string> {
    return hash(password, 10)
  }

  public async compare(
    password: string,
    hashedPassword: string
  ): Promise<boolean> {
    return compare(password, hashedPassword || '')
  }
}
