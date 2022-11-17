import { IAuthUserEntityForResponse } from '../definitions'

export class UserLoggedInEvent<TRequestPayload = Record<string, any>> {
  public constructor(
    public readonly user: IAuthUserEntityForResponse,
    public readonly isImpersonated: boolean,
    public readonly requestPayload: TRequestPayload
  ) {}
}
