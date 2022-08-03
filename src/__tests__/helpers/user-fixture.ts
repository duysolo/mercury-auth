export function generateCorrectUserPayload(): Record<string, string> {
  return {
    username: 'sample-user@gmail.com',
    password: 'testLogin@12345',
  }
}

export function generateInvalidUserPayload(): Record<string, string> {
  return {
    username: 'sample-user@gmail.com',
    password: 'testLogin@12345-invalid-pass',
  }
}
