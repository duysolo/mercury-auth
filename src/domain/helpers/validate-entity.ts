import { Type, ValidationPipe } from '@nestjs/common'

export async function validateEntity<T>(
  value: unknown,
  toEntity: Type<T>,
  whitelist: boolean = false
): Promise<T> {
  return await new ValidationPipe({
    transform: true,
    whitelist,
  }).transform(value, {
    type: 'body',
    metatype: toEntity as unknown as Type<T>,
  })
}
