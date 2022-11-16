import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { lastValueFrom, map } from 'rxjs'
import {
  AuthRepository,
  hideRedactedFields,
  IAuthDefinitions,
  IAuthUserEntityForResponse,
  InjectAuthDefinitions,
  TokenService,
} from '../../../domain'
import { GetCurrentUserByRefreshTokenQuery } from '../get-current-user-by-refresh-token.query'

@QueryHandler(GetCurrentUserByRefreshTokenQuery)
export class GetCurrentUserByRefreshTokenQueryHandler
  implements
    IQueryHandler<
      GetCurrentUserByRefreshTokenQuery,
      IAuthUserEntityForResponse | undefined
    >
{
  public constructor(
    @InjectAuthDefinitions()
    protected readonly authDefinitions: IAuthDefinitions,
    protected readonly authRepository: AuthRepository,
    protected readonly jwtService: TokenService
  ) {}

  public async execute(query: GetCurrentUserByRefreshTokenQuery) {
    const jwtPayload = query.token
      ? this.jwtService.decodeRefreshToken(query.token)
      : undefined

    return jwtPayload
      ? await lastValueFrom(
          this.authRepository
            .getAuthUserByUsername(jwtPayload.username)
            .pipe(map(hideRedactedFields(this.authDefinitions.redactedFields)))
        )
      : undefined
  }
}
