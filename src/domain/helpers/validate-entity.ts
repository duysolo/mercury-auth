import { Type, ValidationPipe } from '@nestjs/common'

export async function validateEntity<T>(
  value: unknown,
  toEntity: Type<T>
): Promise<T> {
  const res = await new ValidationPipe({
    transform: true,
    whitelist: true,
  }).transform(value, {
    type: 'body',
    metatype: toEntity as unknown as Type<T>,
  })

  return res as T
}
