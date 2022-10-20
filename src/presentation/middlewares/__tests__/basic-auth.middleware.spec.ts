import { TestingModule } from '@nestjs/testing/testing-module'
import { IncomingMessage, ServerResponse } from 'http'
import {
  createTestingModule,
  defaultAuthDefinitionsFixture,
} from '../../../__tests__/helpers'
import { IAuthDefinitions } from '../../../domain'
import { BasicAuthMiddleware } from '../basic-auth.middleware'

describe('BasicAuthMiddleware', () => {
  let app: TestingModule

  let middleware: BasicAuthMiddleware

  const fixture = defaultAuthDefinitionsFixture()

  beforeAll(async () => {
    app = await createTestingModule(fixture)

    middleware = app.get(BasicAuthMiddleware)
  })

  it('should be defined', function () {
    expect(middleware).toBeDefined()
  })

  it('should able to set WWW-Authenticate header', function () {
    testRealm(middleware, 'Mercury Labs Authentication')
  })

  it('should able to custom WWW-Authenticate header realm', async () => {
    const customRealmName = 'My Custom Realm'

    const appCustomRealm: TestingModule = await createTestingModule({
      ...fixture,
      basicAuth: {
        ...(fixture.basicAuth || {}),
        realm: customRealmName,
      } as IAuthDefinitions['basicAuth'],
    })

    const customRealmNameMiddleware = appCustomRealm.get(BasicAuthMiddleware)

    testRealm(customRealmNameMiddleware, customRealmName)
  })
})

function testRealm(middleware: BasicAuthMiddleware, realmName: string) {
  const serverResponse: ServerResponse = {
    setHeader: () => ({} as any),
  } as any

  const spy = jest.spyOn(serverResponse, 'setHeader')

  middleware.use(
    {} as unknown as IncomingMessage,
    serverResponse as ServerResponse,
    () => undefined
  )

  expect(spy).toBeCalled()
  expect(spy).toBeCalledWith(
    'WWW-Authenticate',
    `Basic realm="${realmName || ''}", charset="UTF-8"`
  )
}
