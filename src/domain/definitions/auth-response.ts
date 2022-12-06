import { IJwtTokenResponse } from '../services'
import { IAuthUserEntityForResponse } from './auth-user'

export interface IAuthWithTokenResponse<
  UserDataType = IAuthUserEntityForResponse
> {
  userData: UserDataType
  token: IJwtTokenResponse
}

export interface IRefreshTokenAuthResponse<
  UserDataType = IAuthUserEntityForResponse
> {
  userData: UserDataType
  token: Omit<IJwtTokenResponse, 'refreshToken' | 'refreshTokenExpiryDate'>
}

export interface IAuthResponse<UserDataType = IAuthUserEntityForResponse>
  extends Omit<IAuthWithTokenResponse<UserDataType>, 'token'> {}
