import { IJwtPayload } from '../../domain'

export class GetCurrentUserByAccessTokenQuery {
  public constructor(public input: IJwtPayload) {}
}
