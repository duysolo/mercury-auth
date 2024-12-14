import { ExecutionContext } from '@nestjs/common'

export class UserLogoutCommand {
  public constructor(public readonly context: ExecutionContext) {}
}
