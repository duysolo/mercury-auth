export type IAuthUserEntity<
  HashedPasswordType = string,
  T = Record<string, any>
> = T & {
  id: string
  username: string
  password?: HashedPasswordType
}

export type IAuthUserEntityForResponse = Omit<IAuthUserEntity, 'password'>
