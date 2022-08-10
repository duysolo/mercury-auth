import { CustomDecorator, Type } from '@nestjs/common'

type TDecorator = () => CustomDecorator

export function metadataDecoratorTestHelper(
  name: string,
  decorator: TDecorator,
  metadataKey: any,
  expectedValue: any
) {
  describe(`${name} decorator tests`, () => {
    const testClass: Type = generateTestDecorator(decorator, 'class')
    const testMethod: Type = generateTestDecorator(decorator, 'method')

    it('should able to get class metadata', function () {
      const metadata = Reflect.getMetadata(metadataKey, testClass)

      expect(metadata).toEqual(expectedValue)
    })

    it('should able to get method metadata', function () {
      const metadata = Reflect.getMetadata(metadataKey, testMethod['handle'])

      expect(metadata).toEqual(expectedValue)
    })
  })

  function generateTestDecorator(
    decorator: () => CustomDecorator,
    type: 'method' | 'class'
  ): Type {
    if (type === 'class') {
      @decorator()
      class TestDecoratorClass {}

      return TestDecoratorClass
    }

    class TestDecoratorMethod {
      @decorator()
      public static handle() {}
    }

    return TestDecoratorMethod
  }
}
