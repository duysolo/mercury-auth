import { AuthDto } from '../../domain'

export class LoginCommand {
  public constructor(public readonly input: AuthDto) {}
}
