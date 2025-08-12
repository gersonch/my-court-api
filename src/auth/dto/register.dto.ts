import { IsEmail, IsNumber, IsOptional, IsString, MinLength } from 'class-validator'
import { Transform } from 'class-transformer'

export class RegisterDto {
  @Transform(({ value }: { value: string }) => value.trim())
  @IsString()
  @MinLength(2)
  name: string

  @IsEmail()
  email: string

  @Transform(({ value }: { value: string }) => value.trim())
  @IsString()
  @MinLength(6)
  password: string

  @IsString()
  @IsOptional()
  role: string

  @IsString()
  @IsOptional()
  lastName: string

  @IsNumber()
  @IsOptional()
  phone: number

  @IsString()
  @IsOptional()
  city: string

  @IsString()
  @IsOptional()
  country: string

  @IsString()
  @IsOptional()
  address: string

  @IsString()
  @IsOptional()
  image_url: string

  @IsString()
  rut: string

  @IsString()
  provider: string
}
