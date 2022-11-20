import { ExecutionContext } from '@nestjs/common'

export class UserLogoutQuery {
  public constructor(
    public context: ExecutionContext
  ) {}
}
