import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { lastValueFrom } from 'rxjs'
import {
  GetUserByJwtTokenAction,
  IAuthResponse,
  IJwtPayload,
} from '../../../domain'
import { GetCurrentUserByAccessTokenQuery } from '../get-current-user-by-access-token.query'
import { JwtService } from '@nestjs/jwt'

@QueryHandler(GetCurrentUserByAccessTokenQuery)
export class GetCurrentUserByAccessTokenQueryHandler
  implements
    IQueryHandler<GetCurrentUserByAccessTokenQuery, IAuthResponse | null>
{
  public constructor(
    protected readonly action: GetUserByJwtTokenAction,
    protected readonly jwt: JwtService
  ) {}

  public async execute(query: GetCurrentUserByAccessTokenQuery) {
    try {
      const decoded = this.jwt.decode(query.accessToken) as IJwtPayload

      if (!decoded) {
        return null
      }

      const res = await lastValueFrom(
        this.action.handle({ ...query, jwtPayload: decoded })
      )

      return res || null
    } catch (error) {
      return null
    }
  }
}
