import { UnauthorizedException } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { lastValueFrom } from 'rxjs'
import {
  GetUserByJwtTokenAction,
  IAuthUserEntityForResponse,
} from '../../../domain'
import { GetCurrentUserByAccessTokenQuery } from '../get-current-user-by-access-token.query'

@QueryHandler(GetCurrentUserByAccessTokenQuery)
export class GetCurrentUserByAccessTokenQueryHandler
  implements
    IQueryHandler<
      GetCurrentUserByAccessTokenQuery,
      IAuthUserEntityForResponse | undefined
    >
{
  public constructor(protected readonly action: GetUserByJwtTokenAction) {}

  public async execute(query: GetCurrentUserByAccessTokenQuery) {
    try {
      return await lastValueFrom(this.action.handle(query.input))
    } catch (error) {
      throw new UnauthorizedException()
    }
  }
}
