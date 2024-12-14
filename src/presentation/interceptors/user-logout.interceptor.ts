import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common'
import { CommandBus } from '@nestjs/cqrs'
import { asyncScheduler, map, mergeMap, Observable, scheduled } from 'rxjs'
import { UserLogoutCommand } from '../../application/actions'

@Injectable()
export class UserLogoutInterceptor implements NestInterceptor {
  public constructor(protected readonly _bus: CommandBus) {}

  public intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Observable<any> {
    return next.handle().pipe(
      mergeMap((res) => {
        return scheduled(
          this._bus.execute(new UserLogoutCommand(context)),
          asyncScheduler
        ).pipe(map(() => res))
      })
    )
  }
}
