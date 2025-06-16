export interface IJwtPayload {
  sub: string // ID del usuario
  email: string
  role: string
  // puedes agregar más campos si los incluyes en el token
}
