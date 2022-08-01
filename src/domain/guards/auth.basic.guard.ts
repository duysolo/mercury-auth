import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { IAuthDefinitions } from '../../infrastructure'
import { InjectAuthDefinitions } from '../decorators'
import { getRequestFromContext, getRequestHeader } from '../helpers'

export interface IBasicAuthCredentials {
  username: string
  password: string
}

@Injectable()
export class AuthBasicGuard implements CanActivate {
  private _credentials: IBasicAuthCredentials

  public constructor(
    @InjectAuthDefinitions()
    credentials: IAuthDefinitions
  ) {
    this._credentials = credentials.basicAuth
  }

  public canActivate(context: ExecutionContext): boolean {
    const request = getRequestFromContext(context)

    const authenticationHeader = getRequestHeader(request, 'authorization')

    const [, token] = authenticationHeader?.split(' ') || []

    return !!authenticationHeader && !!token && this.validateToken(token)
  }

  protected validateToken(token: string): boolean {
    const decodedToken = Buffer.from(token, 'base64').toString('ascii')
    const [username, password] = decodedToken.split(':')

    return this.validateLogin(username, password)
  }

  protected validateLogin(username: string, password: string): boolean {
    if (!this._credentials.username || !this._credentials.password) {
      return false
    }

    return (
      username === this._credentials.username &&
      password === this._credentials.password
    )
  }
}
