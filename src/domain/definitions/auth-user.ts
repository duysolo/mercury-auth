export type IAuthUserEntity<T = Record<string, any>> = T & {
  id: string
  username: string
  password?: string
}

export type IAuthUserEntityForResponse = Omit<IAuthUserEntity, 'password'>
