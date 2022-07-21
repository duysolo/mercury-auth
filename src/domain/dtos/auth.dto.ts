import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString } from 'class-validator'

export class AuthDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  public username: string

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  public password: string
}
