import { HttpStatus } from '@nestjs/common'

export class CustomException extends Error {
  public message: string
  public data?: any
  public help?:
    | string
    | string[]
    | any
  public code?: HttpStatus

  public constructor(
    message: string,
    data?: any,
    help?:
      | string
      | string[]
      | any,
    code?: HttpStatus
  ) {
    super(message)

    this.message = message
    this.data = data
    this.help = help
    this.code = code || HttpStatus.BAD_REQUEST
  }
}
