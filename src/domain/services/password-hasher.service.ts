import { Injectable } from "@nestjs/common";

export const AUTH_PASSWORD_HASHER: symbol = Symbol('AUTH_PASSWORD_HASHER')

@Injectable()
export abstract class PasswordHasherService<T = any> {
  public abstract hash(password: string): Promise<T>

  public abstract compare(password: string, hashedPassword: T): Promise<boolean>
}
