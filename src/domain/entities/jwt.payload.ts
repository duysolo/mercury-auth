import { ApiProperty } from '@nestjs/swagger'
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator'

export interface IJwtPayload<T = string> {
  iat: number
  exp: number
  iss: string
  sub: T
  uuid?: string
  username?: string
}

export interface IJwtPayloadRawDecoded {
  iat: number
  exp: number
  iss: string
  sub: string
  uuid?: string
  username?: string
}

export class JwtPayload implements IJwtPayload {
  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  public iat: number // Issued date unix timestamp

  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  public exp: number // Expiry date unix timestamp

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  public iss: string

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  public sub: string // Should be the ID in database

  @ApiProperty()
  @IsOptional()
  public username: string // Only available for self-signed JWT
}
