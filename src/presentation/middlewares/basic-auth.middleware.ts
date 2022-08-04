import { Injectable, NestMiddleware } from '@nestjs/common'
import { IncomingMessage, ServerResponse } from 'http'
import { InjectAuthDefinitions } from '../../domain'
import { IAuthDefinitions } from '../../infrastructure'

@Injectable()
export class BasicAuthMiddleware implements NestMiddleware {
  public constructor(
    @InjectAuthDefinitions()
    protected readonly authDefinitions: IAuthDefinitions
  ) {
  }

  public use(
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void
  ): void {
    res.setHeader(
      'WWW-Authenticate',
      `Basic realm="${
        this.authDefinitions?.basicAuth?.realm || 'Mercury Labs Authentication'
      }", charset="UTF-8"`
    )

    next()
  }
}
