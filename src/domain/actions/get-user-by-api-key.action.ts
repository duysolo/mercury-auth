import { Injectable } from '@nestjs/common'
import { EventBus } from '@nestjs/cqrs'
import { forkJoin, map, Observable, of } from 'rxjs'
import { InjectAuthDefinitions } from '../decorators'
import {
  IAuthDefinitions,
  IAuthResponse,
  IAuthUserEntityForResponse,
} from '../definitions'
import { hideRedactedFields } from '../helpers'
import { AuthRepository } from '../repositories'
import { TokenService } from '../services'

export interface IGetUserByApiKeyActionOptions {
  apiKey: string
}

@Injectable()
export class GetUserByApiKeyAction {
  public constructor(
    @InjectAuthDefinitions()
    public readonly authDefinitions: IAuthDefinitions,
    protected readonly authRepository: AuthRepository,
    protected readonly tokenService: TokenService,
    protected readonly jwtService: TokenService,
    protected readonly eventBus: EventBus
  ) {}

  public handle<T extends IAuthUserEntityForResponse>({
    apiKey,
  }: IGetUserByApiKeyActionOptions): Observable<IAuthResponse<T> | undefined> {
    if (!apiKey) {
      return of(undefined)
    }

    return forkJoin([this.authRepository.getAuthUserByApiKey(apiKey)]).pipe(
      map(([res]) => res),
      map(hideRedactedFields(this.authDefinitions.redactedFields)),
      map((userData) => {
        if (!userData) {
          return undefined
        }

        return { userData } as IAuthResponse<T>
      })
    )
  }
}
