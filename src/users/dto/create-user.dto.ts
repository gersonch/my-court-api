import { IsEmail, IsString, ValidateIf } from 'class-validator'

export class CreateUserDto {
  @IsString()
  name: string

  @IsEmail()
  email: string

  @ValidateIf((o: CreateUserDto) => o.provider === 'local')
  @IsString()
  password: string

  @IsString()
  role: string

  @IsString()
  refreshToken?: string

  @ValidateIf((o: CreateUserDto) => o.provider === 'local')
  @IsString()
  rut: string

  @IsString()
  provider?: string
}
