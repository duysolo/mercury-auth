import { IJwtPayload } from '../../domain'

export class GetCurrentUserByAccessTokenQuery {
  public constructor(
    public accessToken: string,
    public jwtPayload: IJwtPayload
  ) {}
}
