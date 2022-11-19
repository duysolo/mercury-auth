import { IJwtTokenResponse } from '../services'
import { IAuthUserEntityForResponse } from './auth-user'

export interface IAuthWithTokenResponse {
  userData: IAuthUserEntityForResponse
  token: IJwtTokenResponse
}

export interface IRefreshTokenAuthResponse {
  userData: IAuthUserEntityForResponse
  token: Omit<IJwtTokenResponse, 'refreshToken'>
}

export interface IAuthResponse extends Omit<IAuthWithTokenResponse, 'token'> {}
