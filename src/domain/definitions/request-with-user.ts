import { IAuthUserEntityForResponse } from '..'

export type IRequestWithUser<HttpAdaptorRequest = any> = HttpAdaptorRequest & {
  user: IAuthUserEntityForResponse
}
