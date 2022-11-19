import { UnauthorizedException } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { lastValueFrom } from 'rxjs'
import { GetUserByRefreshTokenAction, IAuthResponse } from '../../../domain'
import { GetCurrentUserByRefreshTokenQuery } from '../get-current-user-by-refresh-token.query'

@QueryHandler(GetCurrentUserByRefreshTokenQuery)
export class GetCurrentUserByRefreshTokenQueryHandler
  implements
    IQueryHandler<GetCurrentUserByRefreshTokenQuery, IAuthResponse | undefined>
{
  public constructor(protected readonly action: GetUserByRefreshTokenAction) {}

  public async execute(query: GetCurrentUserByRefreshTokenQuery) {
    try {
      return await lastValueFrom(this.action.handle(query))
    } catch (error) {
      throw new UnauthorizedException()
    }
  }
}
