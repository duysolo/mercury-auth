import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common'
import { QueryBus } from '@nestjs/cqrs'
import { asyncScheduler, map, mergeMap, Observable, scheduled } from 'rxjs'
import { UserLogoutQuery } from '../../application/queries'

@Injectable()
export class UserLogoutInterceptor implements NestInterceptor {
  public constructor(protected readonly queryBus: QueryBus) {}

  public intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Observable<any> {
    return next.handle().pipe(
      mergeMap((res) => {
        return scheduled(
          this.queryBus.execute(new UserLogoutQuery(context)),
          asyncScheduler
        ).pipe(map(() => res))
      })
    )
  }
}
