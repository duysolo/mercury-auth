import { Test, TestingModule } from '@nestjs/testing'
import { HashingModule } from '../hashing.module'
import { HashTextService } from '../domain/services'

describe('HashingModule', () => {
  let hashingModule: TestingModule

  let hashTextService: HashTextService

  const stringToBeEncoded = 'string-to-be-encoded'

  const objectToBeEncoded = {
    name: 'string-to-be-encoded',
    value: 'value-to-be-encoded',
  }

  beforeAll(async () => {
    hashingModule = await Test.createTestingModule({
      imports: [
        HashingModule.forRootAsync({
          useFactory: () => {
            return {
              secretKey: 'GOo7cVgnCBnR8TvXIgvamXNb85cPVtJi',
            }
          },
        }),
      ],
    }).compile()

    hashTextService = hashingModule.get(HashTextService)
  })

  it('The HashTextService should be defined correctly', async () => {
    expect(hashTextService).toBeDefined()
  })

  it('Should able to encode string', async () => {
    expect(hashTextService.encode(stringToBeEncoded).length).toBeGreaterThan(0)
  })

  it('Should able to decode string', async () => {
    const encodedString = hashTextService.encode(stringToBeEncoded)

    expect(hashTextService.decode(encodedString)).toEqual(stringToBeEncoded)
  })

  it('Should able to encode JSON', async () => {
    expect(hashTextService.encodeJSON(objectToBeEncoded)).toBeDefined()
  })

  it('Should able to decode JSON', async () => {
    const encodedObject = hashTextService.encodeJSON(objectToBeEncoded)

    expect(hashTextService.decodeJSON(encodedObject || '')).toMatchObject(
      objectToBeEncoded
    )
  })
})
