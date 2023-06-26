import { BadRequestException, Injectable } from '@nestjs/common'
import crypto from 'crypto'
import { IHashingOptions } from '../../hashing.module'

interface IHash {
  iv: string
  content: string
}

@Injectable()
export class HashTextService {
  private readonly _algorithm: string = 'aes-256-ctr'

  public constructor(private readonly _options: IHashingOptions) {
    if (
      _options.enabled &&
      (!_options?.secretKey || _options.secretKey.length !== 32)
    ) {
      throw new BadRequestException(
        'INVALID_HASHING_SECRET_KEY',
        'Secret key is required and should be 32 characters'
      )
    }
  }

  public encode(textToEncode: string): string {
    if (!textToEncode || !this._options.enabled || !this._options.secretKey) {
      return textToEncode
    }

    const iv = crypto.randomBytes(16)

    const cipher = crypto.createCipheriv(
      this._algorithm,
      this._options.secretKey,
      iv
    )

    const encrypted = Buffer.concat([
      cipher.update(textToEncode),
      cipher.final(),
    ])

    return Buffer.from(
      JSON.stringify({
        iv: iv.toString('hex'),
        content: encrypted.toString('hex'),
      })
    ).toString('base64')
  }

  public decode(hashedText: string): string | undefined {
    if (!hashedText || !this._options.enabled || !this._options.secretKey) {
      return hashedText
    }

    try {
      const hash: IHash = JSON.parse(
        Buffer.from(hashedText, 'base64').toString('utf-8')
      )

      const decipher = crypto.createDecipheriv(
        this._algorithm,
        this._options.secretKey,
        Buffer.from(hash.iv, 'hex')
      )

      return Buffer.concat([
        decipher.update(Buffer.from(hash.content, 'hex')),
        decipher.final(),
      ]).toString()
    } catch {
      return undefined
    }
  }

  public encodeJSON(obj: any): string | undefined {
    try {
      return this.encode(JSON.stringify(obj))
    } catch {
      return undefined
    }
  }

  public decodeJSON<T = any>(hashedObj: string): T | undefined {
    try {
      const decodedText = this.decode(hashedObj)

      return decodedText ? JSON.parse(decodedText) : undefined
    } catch {
      return undefined
    }
  }
}
