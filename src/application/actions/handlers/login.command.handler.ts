import { ICommandHandler, CommandHandler } from '@nestjs/cqrs'
import { lastValueFrom } from 'rxjs'
import { IAuthUserEntityForResponse, LocalLoginAction } from '../../../domain'
import { LoginCommand } from '../login.command'

@CommandHandler(LoginCommand)
export class LoginCommandHandler
  implements ICommandHandler<LoginCommand, IAuthUserEntityForResponse>
{
  public constructor(protected readonly action: LocalLoginAction) {}

  public async execute(query: LoginCommand) {
    return lastValueFrom(this.action.handle(query.input))
  }
}
