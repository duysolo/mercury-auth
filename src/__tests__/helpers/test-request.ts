import { INestApplication } from '@nestjs/common'
import { NestFastifyApplication } from '@nestjs/platform-fastify'
import { Response as LightMyRequestResponse } from 'light-my-request'
import request, { Response } from 'supertest'

interface IRequestOptions {
  path: string
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  headers?: Record<string, any>
  query?: Record<string, any>
  body?: Record<string, any>
}

export async function fastifyRequest(
  app: NestFastifyApplication,
  options: IRequestOptions
): Promise<LightMyRequestResponse> {
  return app
    .inject({
      url: options.path,
      method: options.method,
      headers: options.headers,
      query: options.query,
      payload: options.body,
    })
    .then((res: LightMyRequestResponse) => res as any, console.error)
}

export async function expressRequest(
  app: INestApplication,
  options: IRequestOptions
): Promise<Response> {
  let method: string

  switch (options.method) {
    case 'GET':
      method = 'get'
      break
    case 'POST':
      method = 'post'
      break
    case 'PUT':
      method = 'put'
      break
    case 'PATCH':
      method = 'patch'
      break
    case 'DELETE':
      method = 'delete'
      break
  }

  return request(app.getHttpServer())
    [method](options.path)
    .query(options.query || {})
    .set(options.headers || {})
    .send(options.body)
    .then((res: Response) => res as any, console.error)
}
