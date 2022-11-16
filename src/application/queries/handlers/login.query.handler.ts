import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { lastValueFrom } from 'rxjs'
import { IAuthUserEntityForResponse, LocalLoginAction } from '../../../domain'
import { LoginQuery } from '../login.query'

@QueryHandler(LoginQuery)
export class LoginQueryHandler
  implements IQueryHandler<LoginQuery, IAuthUserEntityForResponse> {
  public constructor(protected readonly action: LocalLoginAction) {
  }

  public async execute(query: LoginQuery) {
    return lastValueFrom(this.action.handle(query.input))
  }
}
