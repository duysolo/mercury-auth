import { FastifyRequest } from 'fastify'
import { IAuthUserEntityForResponse } from '..'

export type IRequestWithUser = FastifyRequest & {
  user: IAuthUserEntityForResponse
}
