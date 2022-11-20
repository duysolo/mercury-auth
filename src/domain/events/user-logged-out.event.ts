import { IAuthUserEntityForResponse } from '../definitions'

export class UserLoggedOutEvent {
  public constructor(
    public readonly currentAccessToken: string,
    public readonly user: IAuthUserEntityForResponse
  ) {
  }
}
