import { IAuthUserEntityForResponse } from '../definitions'
import { IJwtTokenResponse } from '../services'

export class UserLoggedInEvent<TRequestPayload = Record<string, any>> {
  public constructor(
    public readonly user: IAuthUserEntityForResponse,
    public readonly isImpersonated: boolean,
    public readonly requestPayload: TRequestPayload,
    public readonly token: IJwtTokenResponse
  ) {
  }
}
