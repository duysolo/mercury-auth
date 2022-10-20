import { IJwtTokenResponse } from '../services'
import { IAuthUserEntityForResponse } from './auth-user'

export interface IAuthResponse {
  userData: IAuthUserEntityForResponse
  token: IJwtTokenResponse
}

export interface IRefreshTokenAuthResponse {
  userData: IAuthUserEntityForResponse
  token: Omit<IJwtTokenResponse, 'refreshToken'>
}
