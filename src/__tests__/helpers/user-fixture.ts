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

export function generateCorrectApiKey() {
  return '01940cbd-0735-709f-b3f2-0bc6dbaac15f'
}

export function generateInvalidApiKey() {
  return '01940cb7-c669-709e-9ac1-b9f407257091'
}
