import { Transform } from 'class-transformer'
import { IsEmail, IsString, MinLength } from 'class-validator'

// SWAGGER: Decorators para documentación
import { ApiProperty } from '@nestjs/swagger'

export class LoginDto {
  @ApiProperty({ example: 'juan@email.com', description: 'Correo electrónico' })
  @IsEmail()
  email: string

  @ApiProperty({ example: 'password123', description: 'Contraseña (mínimo 6 caracteres)', minLength: 6 })
  @Transform(({ value }) => value.trim())
  @IsString()
  @MinLength(6)
  password: string
}
