import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { lastValueFrom } from 'rxjs'
import { LogoutAction } from '../../../domain'
import { UserLogoutCommand } from '../user-logout.command'

@CommandHandler(UserLogoutCommand)
export class UserLogoutCommandHandler
  implements ICommandHandler<UserLogoutCommand, void>
{
  public constructor(protected readonly action: LogoutAction) {}

  public async execute(query: UserLogoutCommand): Promise<void> {
    return lastValueFrom(this.action.handle(query))
  }
}
