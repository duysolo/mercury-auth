import { UnauthorizedException } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { lastValueFrom } from 'rxjs'
import {
  GetUserByApiKeyAction,
  IAuthUserEntityForResponse
} from '../../../domain'
import { GetCurrentUserByApiKeyQuery } from '../get-current-user-by-api-key.query'

@QueryHandler(GetCurrentUserByApiKeyQuery)
export class GetCurrentUserByApiKeyQueryHandler
  implements
    IQueryHandler<
      GetCurrentUserByApiKeyQuery,
      IAuthUserEntityForResponse | undefined
    >
{
  public constructor(protected readonly action: GetUserByApiKeyAction) {}

  public async execute(query: GetCurrentUserByApiKeyQuery) {
    try {
      return lastValueFrom(this.action.handle(query))
    } catch (error) {
      throw new UnauthorizedException()
    }
  }
}
