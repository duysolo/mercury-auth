import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Observable, of } from 'rxjs'
import { IJwtPayload } from '../entities'

export interface IParseJwtTokenActionOptions {
  token: string
}

@Injectable()
export class ParseJwtTokenAction {
  public constructor(public readonly jwtService: JwtService) {}

  public handle(dto: IParseJwtTokenActionOptions): Observable<IJwtPayload> {
    return of(this.jwtService.decode(dto.token) as unknown as IJwtPayload)
  }
}
