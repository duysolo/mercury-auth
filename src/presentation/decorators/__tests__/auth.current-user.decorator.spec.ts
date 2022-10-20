import { ExecutionContext } from '@nestjs/common'
import { currentUserDecoratorFactory } from '../auth.current-user.decorator'

interface IWithUser {
  user: {
    id: string
    username: string
  }
}

describe('CurrentUser', () => {
  const user = {
    id: 'some-user-id',
    username: 'some-user-username',
  }

  const mockContext: ExecutionContext = {
    getType: () => {
      return 'http'
    },
    switchToHttp: () => {
      return {
        getRequest(): IWithUser {
          return {
            user,
          }
        },
      }
    },
  } as any

  it('should show user info', () => {
    const res = currentUserDecoratorFactory({}, mockContext)

    expect(res.id).toEqual(user.id)
    expect(res.username).toEqual(user.username)
  })

  it('should not show user if not exists', () => {
    jest.spyOn(mockContext, 'switchToHttp').mockImplementation((() => {
      return {
        getRequest() {
          return {} as any
        },
      }
    }) as any)

    const res = currentUserDecoratorFactory({}, mockContext)

    expect(res).toBeUndefined()
  })
})
