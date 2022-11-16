import { AuthDto } from '../../domain'

export class LoginQuery {
  public constructor(public input: AuthDto) {}
}
