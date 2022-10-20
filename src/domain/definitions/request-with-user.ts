import { IAuthUserEntityForResponse } from '../index'

export type IRequestWithUser<HttpAdaptorRequest = any> = HttpAdaptorRequest & {
  user: IAuthUserEntityForResponse
}
