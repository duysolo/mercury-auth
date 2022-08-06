import { IsInt, IsNotEmpty, IsString } from 'class-validator'

export interface IJwtPayloadRawDecoded {
  iat: number
  exp: number
  username: string
  sub: string
}

export interface IJwtPayload<T = string>
  extends Omit<IJwtPayloadRawDecoded, 'sub'> {
  sub: T
}

export class JwtPayload implements IJwtPayload {
  @IsNotEmpty()
  @IsInt()
  public iat: number // Issued date unix timestamp

  @IsNotEmpty()
  @IsInt()
  public exp: number // Expiry date unix timestamp

  @IsNotEmpty()
  @IsString()
  public username: string

  @IsNotEmpty()
  @IsString()
  public sub: string // Should be the ID in database
}
