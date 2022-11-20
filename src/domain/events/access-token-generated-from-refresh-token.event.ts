import { IAuthUserEntityForResponse } from '../definitions'
import { IJwtTokenResponse } from '../services'

export class AccessTokenGeneratedFromRefreshTokenEvent {
  public constructor(
    public readonly currentRefreshToken: string,
    public readonly user: IAuthUserEntityForResponse,
    public readonly newToken: IJwtTokenResponse
  ) {}
}
