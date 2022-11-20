import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { lastValueFrom } from 'rxjs'
import { LogoutAction } from '../../../domain'
import { UserLogoutQuery } from '../user-logout.query'

@QueryHandler(UserLogoutQuery)
export class UserLogoutQueryHandler
  implements IQueryHandler<UserLogoutQuery, void>
{
  public constructor(protected readonly action: LogoutAction) {}

  public async execute(query: UserLogoutQuery): Promise<void> {
    return lastValueFrom(this.action.handle(query))
  }
}
