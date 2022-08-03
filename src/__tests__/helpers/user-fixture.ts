interface ITestingAuthUserDto {
  username: string
  password: string
}

export function generateCorrectUserPayload(): ITestingAuthUserDto {
  return {
    username: 'sample-user@gmail.com',
    password: 'testLogin@12345',
  }
}

export function generateCorrectUserPayloadImpersonate(impersonate: {
  cipher: string
  password: string
}): ITestingAuthUserDto {
  const user = generateCorrectUserPayload()

  return {
    username: `${impersonate.cipher}${user.username}`,
    password: impersonate.password,
  }
}

export function generateInvalidUserPayload(): ITestingAuthUserDto {
  return {
    username: 'sample-user@gmail.com',
    password: 'testLogin@12345-invalid-pass',
  }
}

export function generateInvalidUserPayloadImpersonate(impersonate?: {
  cipher: string
  password: string
}): ITestingAuthUserDto {
  const user = generateCorrectUserPayload()

  return {
    username: `${impersonate?.cipher || ''}${user.username}`,
    password: impersonate?.password || '',
  }
}
