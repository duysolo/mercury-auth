import { Type, ValidationPipe } from '@nestjs/common'
import { asyncScheduler, map, scheduled } from 'rxjs'

export function validateEntity<T>(value: unknown, toEntity: Type<T>) {
  return scheduled(
    new ValidationPipe({ transform: true, whitelist: true }).transform(value, {
      type: 'body',
      metatype: toEntity as unknown as Type<T>,
    }) as any,
    asyncScheduler
  ).pipe(map((res) => res as T))
}
