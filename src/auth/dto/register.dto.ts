import { IsEmail, IsNumber, IsOptional, IsString, MinLength } from 'class-validator'
import { Transform } from 'class-transformer'

// SWAGGER: Decorators para documentación
import { ApiProperty } from '@nestjs/swagger'

export class RegisterDto {
  @ApiProperty({ example: 'Juan Pérez', description: 'Nombre del usuario' })
  @Transform(({ value }: { value: string }) => value.trim())
  @IsString()
  @MinLength(2)
  name: string

  @ApiProperty({ example: 'juan@email.com', description: 'Correo electrónico' })
  @IsEmail()
  email: string

  @ApiProperty({
    example: 'password123',
    description: 'Contraseña (mínimo 6 caracteres)',
    minLength: 6,
  })
  @Transform(({ value }: { value: string }) => value.trim())
  @IsString()
  @MinLength(6)
  password: string

  @ApiProperty({ example: 'user', description: 'Rol del usuario (user/admin)', required: false })
  @IsString()
  @IsOptional()
  role: string

  @ApiProperty({ example: 'Pérez', description: 'Apellido del usuario', required: false })
  @IsString()
  @IsOptional()
  lastName: string

  @ApiProperty({ example: 123456789, description: 'Número de teléfono', required: false })
  @IsNumber()
  @IsOptional()
  phone: number

  @ApiProperty({ example: 'Santiago', description: 'Ciudad', required: false })
  @IsString()
  @IsOptional()
  city: string

  @ApiProperty({ example: 'Chile', description: 'País', required: false })
  @IsString()
  @IsOptional()
  country: string

  @ApiProperty({ example: 'Av. Principal 123', description: 'Dirección', required: false })
  @IsString()
  @IsOptional()
  address: string

  @ApiProperty({
    example: 'https://example.com/image.jpg',
    description: 'URL de imagen de perfil',
    required: false,
  })
  @IsString()
  @IsOptional()
  image_url: string

  @ApiProperty({ example: '12345678-9', description: 'RUT del usuario' })
  @IsString()
  rut: string

  @ApiProperty({ example: 'google', description: 'Proveedor de autenticación', required: false })
  @IsOptional()
  @IsString()
  provider: string
}
