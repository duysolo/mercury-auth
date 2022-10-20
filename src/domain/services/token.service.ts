import { HashTextService } from '@mercury-labs/nest-hashing'
import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import _ from 'lodash/fp'
import moment from 'moment'
import { forkJoin, map, Observable, of } from 'rxjs'
import type {
  IAuthDefinitions,
  IAuthUserEntityForResponse,
  IJwtPayload,
  IJwtPayloadRawDecoded,
} from '../index'
import { InjectAuthDefinitions } from '../decorators'

export interface IJwtTokenResponse {
  accessToken: string
  refreshToken: string
  expiryDate: Date
}

@Injectable()
export class TokenService {
  public constructor(
    @InjectAuthDefinitions()
    protected readonly authDefinitions: IAuthDefinitions,
    protected readonly jwtService: JwtService,
    protected readonly hashTextService: HashTextService
  ) {}

  public generateTokenResponse(
    userInfo: IAuthUserEntityForResponse
  ): Observable<IJwtTokenResponse> {
    return forkJoin([
      this.generateAccessToken(userInfo),
      this.generateRefreshToken(userInfo),
    ]).pipe(
      map(([accessToken, refreshToken]) => {
        const jwtPayload = this.decodeAccessToken(accessToken) as IJwtPayload

        return {
          accessToken,
          refreshToken,
          expiryDate: moment(_.toInteger(jwtPayload.exp) * 1000).toDate(),
        }
      })
    )
  }

  public generateJwtToken(
    userInfo: IAuthUserEntityForResponse,
    expiresIn: string | number
  ): Observable<string> {
    return of({
      username: this.hashTextService.encode(
        userInfo[this.authDefinitions.usernameField || 'username']
      ),
      sub: this.hashTextService.encode(userInfo.id),
    }).pipe(
      map((payload) =>
        this.jwtService.sign(payload, {
          ...(this.authDefinitions.jwt?.signOptions || {}),
          expiresIn,
        })
      )
    )
  }

  public generateAccessToken(
    userInfo: IAuthUserEntityForResponse
  ): Observable<string> {
    if (!this.authDefinitions.jwt) {
      return of('')
    }

    return this.generateJwtToken(userInfo, this.authDefinitions.jwt.expiresIn)
  }

  public decodeAccessToken(token: string): IJwtPayload | undefined {
    return this.decodeAccessTokenFromRawDecoded(
      this.jwtService.decode(token) as unknown as IJwtPayload
    )
  }

  public decodeAccessTokenFromRawDecoded(
    rawPayload: IJwtPayload
  ): IJwtPayload | undefined {
    const username = this.hashTextService.decode(rawPayload.username) || ''
    const sub = this.hashTextService.decode(rawPayload.sub)

    if (sub) {
      return {
        ...rawPayload,
        username,
        sub,
      }
    }

    return undefined
  }

  public generateRefreshToken(
    userInfo: IAuthUserEntityForResponse
  ): Observable<string> {
    if (!this.authDefinitions.jwt) {
      return of('')
    }

    return this.generateJwtToken(
      userInfo,
      this.authDefinitions.jwt?.refreshTokenExpiresIn
    ).pipe(map((res) => this.hashTextService.encode(res)))
  }

  public decodeRefreshToken(refreshToken: string): IJwtPayload | undefined {
    try {
      return _.pipe([
        transform<string | undefined>((token) =>
          this.hashTextService.decode(token)
        ),
        transform<IJwtPayloadRawDecoded | undefined>(
          (value: string | undefined) =>
            value
              ? (this.jwtService.decode(value) as IJwtPayloadRawDecoded)
              : undefined
        ),
        transform<IJwtPayload | undefined>(
          (value: IJwtPayloadRawDecoded | undefined) =>
            value ? this.decodeAccessTokenFromRawDecoded(value) : undefined
        ),
        transform<IJwtPayload | undefined>((value: IJwtPayload | undefined) => {
          if (value?.exp && value.exp < moment().unix()) {
            return undefined
          }

          return value
        }),
      ])(refreshToken)
    } catch {
      return undefined
    }
  }
}

function transform<Output>(
  iteratee: (input: any) => Output
): (value: any) => Output {
  return (value) => iteratee(value) as unknown as Output
}
