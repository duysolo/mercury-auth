import { IAuthUserEntityForResponse } from '../definitions'

export class UserLoggedInEvent {
  public constructor(public readonly user: IAuthUserEntityForResponse) {}
}
