import { IsString } from 'class-validator'

export class createComplexesDto {
  @IsString()
  name: string

  @IsString()
  address: string

  @IsString()
  city: string
  country: string
  description: string
}
