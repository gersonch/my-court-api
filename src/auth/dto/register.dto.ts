import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator'
import { Transform } from 'class-transformer'

export class RegisterDto {
  @Transform(({ value }) => value.trim())
  @IsString()
  @MinLength(2)
  name: string

  @IsEmail()
  email: string

  @Transform(({ value }) => value.trim())
  @IsString()
  @MinLength(6)
  password: string

  @IsString()
  @IsOptional()
  role: string
}
