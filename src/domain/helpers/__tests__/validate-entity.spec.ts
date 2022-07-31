import { BadRequestException } from '@nestjs/common'
import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { validateEntity } from '../validate-entity'

class EntityForValidating {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  public firstName: string

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  public lastName: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  public gender: string
}

describe('validateEntity helper', () => {
  const correctBody = {
    firstName: 'sample-first-name',
    lastName: 'sample-last-name',
    gender: 'male',
  }

  it('should not able to ignore required fields', async () => {
    await expect(
      validateEntity({ gender: 'male' }, EntityForValidating)
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it('should able to access whitelist fields', async () => {
    const entity = await validateEntity(correctBody, EntityForValidating)

    expect(entity.firstName).toEqual(correctBody.firstName)
    expect(entity.lastName).toEqual(correctBody.lastName)
    expect(entity.gender).toEqual(correctBody.gender)
  })

  it('should able to ignore optional fields', async () => {
    const { gender, ...bodyWithoutOptionalField } = correctBody

    const entity = await validateEntity(
      bodyWithoutOptionalField,
      EntityForValidating
    )

    expect(entity.firstName).toEqual(correctBody.firstName)
    expect(entity.lastName).toEqual(correctBody.lastName)
    expect(entity.gender).toBeUndefined()
  })

  it('should not able to access non-whitelist fields', async () => {
    const entity: any = await validateEntity(correctBody, EntityForValidating)

    expect(entity.nonExistedField).toBeUndefined()
  })
})
