import { Injectable } from '@nestjs/common'
import bcrypt from 'bcrypt'

@Injectable()
export abstract class PasswordHasherService<T = any> {
  public abstract hash(password: string): Promise<T>

  public abstract compare(password: string, hashedPassword: T): Promise<boolean>
}

@Injectable()
export class BcryptPasswordHasherService
  implements PasswordHasherService<string>
{
  public hash(password: string): Promise<string> {
    return bcrypt.hash(password, 32)
  }

  public compare(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword || '')
  }
}
