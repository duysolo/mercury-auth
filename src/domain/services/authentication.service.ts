import { HashTextService } from '@mercury-labs/hashing'
import { Inject, Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import _ from 'lodash/fp'
import moment from 'moment'
import { map, Observable, of } from 'rxjs'
import {
  IAuthUserEntityForResponse,
  IJwtPayload,
  IJwtPayloadRawDecoded,
} from '..'
import {
  AUTH_DEFINITIONS_MODULE_OPTIONS,
  IAuthDefinitions,
} from '../../auth-definitions.module'

export interface IJwtTokenResponse {
  accessToken: string
  refreshToken: string
  expiryDate?: Date
}

@Injectable()
export class AuthenticationService {
  public constructor(
    protected readonly jwtService: JwtService,
    protected readonly hashTextService: HashTextService,
    @Inject(AUTH_DEFINITIONS_MODULE_OPTIONS)
    protected readonly authDefinitions: IAuthDefinitions
  ) {}

  public generateTokenResponse(
    userInfo: IAuthUserEntityForResponse
  ): Observable<IJwtTokenResponse> {
    return this.generateAccessToken(userInfo).pipe(
      map((accessToken) => {
        const jwtPayload = this.decodeAccessToken(accessToken) as IJwtPayload

        return {
          accessToken,
          refreshToken: this.generateRefreshToken(accessToken),
          expiryDate: moment(_.toInteger(jwtPayload.exp) * 1000).toDate(),
        }
      })
    )
  }

  public generateAccessToken(
    userInfo: IAuthUserEntityForResponse
  ): Observable<string> {
    return of({
      username: this.hashTextService.encode(
        userInfo[this.authDefinitions.usernameField || 'username']
      ),
      sub: this.hashTextService.encode(userInfo.id),
    }).pipe(map((payload) => this.jwtService.sign(payload)))
  }

  public decodeAccessToken(token: string): IJwtPayload | undefined {
    return this.decodeAccessTokenFromRawDecoded(
      this.jwtService.decode(token) as unknown as IJwtPayload
    )
  }

  public decodeAccessTokenFromRawDecoded(
    rawPayload: IJwtPayload
  ): IJwtPayload | undefined {
    const username = this.hashTextService.decode(rawPayload.username)
    const sub = this.hashTextService.decode(rawPayload.sub)

    if (username && sub) {
      return {
        ...rawPayload,
        username,
        sub,
      }
    }

    return undefined
  }

  public generateRefreshToken(accessToken: string): string {
    return this.hashTextService.encode(accessToken)
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

function transform<Output>(iteratee: (input: any) => Output) {
  return (value) => iteratee(value) as unknown as Output
}
