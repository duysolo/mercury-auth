export function removeBearerFromToken(
  token: string,
  apiTokenPrefix: string = 'bearer '
): string {
  if (!token) return token

  if (token.toLowerCase().startsWith(apiTokenPrefix)) {
    return token.substring(apiTokenPrefix.length)
  }

  return token
}
