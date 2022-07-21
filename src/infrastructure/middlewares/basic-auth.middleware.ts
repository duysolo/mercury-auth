import { Injectable, NestMiddleware } from '@nestjs/common'
import { IncomingMessage, ServerResponse } from 'http'

@Injectable()
export class BasicAuthMiddleware implements NestMiddleware {
  public use(
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void
  ): void {
    res.setHeader(
      'WWW-Authenticate',
      `Basic realm="Mercury CMS", charset="UTF-8"`
    )

    next()
  }
}
