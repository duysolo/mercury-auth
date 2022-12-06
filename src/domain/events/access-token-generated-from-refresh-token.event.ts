import {
  IAuthUserEntityForResponse,
  IRefreshTokenAuthResponse,
} from '../definitions'

export class AccessTokenGeneratedFromRefreshTokenEvent {
  public constructor(
    public readonly currentRefreshToken: string,
    public readonly user: IAuthUserEntityForResponse,
    public readonly newToken: IRefreshTokenAuthResponse['token']
  ) {}
}
